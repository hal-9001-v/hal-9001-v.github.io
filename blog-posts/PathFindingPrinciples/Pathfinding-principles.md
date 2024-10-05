<link rel="stylesheet" type="text/css" href="blog-posts/blog.css">

### 1. Intro

This is it. I got to the end of my University Degree and now it's time to make a Final Degree Proyect. I chose Pathfinding! So here goes another guide about pathfinding!

#### 1.1 Context
Some time ago, I tried to develop a project with a few friends. Such game was completely inspired by the Sly Cooper games and I was so excited! Yet, it did not
work out(but hey, I learnt a lot).

One of the (many) problems I faced was Unity's Navmesh tool. Sure, it worked pretty well! In just a moment, I had my bad guys moving around with so little effort. But some problems appeared.

<br/>

#### 1.2 Problem
I wanted guard to fly around everytime the player hit them. That implied disabling the navigation, applying some physics and finally enabling the navigation.

For some reason, warping again the agent into the navmesh wasn't so easy. Actually, it was painfully tricky. I needed to play around with some functions with no reasoning but a trial-error proccess I found on the web, and sometimes worked while others it did not.

<div>
    <img src="blog-posts/PathFindingPrinciples/Sil.png" width="500"/>
</div>

<br/>

#### 1.3 The Basics
It goes like this:

* Agents(bad guys, animals...) want to move around in space.
* Space has to be represented in code so it is easily interpreted.
    * This is the hard part. This task could be divided in:
        * Figuring out what the enviroment's collisions mean for the agents's navigation
        * Gathering that info in a discretized and easy to manipulate way
* Agents take that space representation and find the best path for their purpose.

> Take a look at Nathan R. Sturtevant's Game AI Pro 360P's Search Space Representation

##### 1.4 Grid
This one is the easiest. It simply makes an uniform net wich covers all the space. If there is wall in (X,Y), then grid[x][y] = Wall. This is really easy for manual changes, since it could be easily represented in a text file.

<div>
    <img src="blog-posts/PathFindingPrinciples/grid.png" width="300"/>
</div>

Pros:
* Easy to implement
* Easy localization
* Cheap weight-update
* Dynamic environment changes are easily implemented

Cons:
* If accuracy is required we have a problem. The grid is memory-intensive.
* Robotic movement if not handled
* Expensive if it consists in a fine-grain representation

<br>

#### 1.5 Waypoints
The waypoint representation usually depends on the manual side. Devs put transitable points in the map, connecting them. This implies a low-cost solution, with "easy" implementation.

<div>
    <img src="blog-posts/PathFindingPrinciples/waypoints.png" width="300"/>
</div>
<br>

Pros:
* Easy to implement
* Cheap since it only represents a small friction of space
 
 Cons:
* It only represents a small friction of space
* Manual dependant
* Not flexible enough for dynamic changes
* Characters can get stuck

<br>


#### 1.6 Navigation Mesh
Here comes the star. Navmesh consist in a world representation through polygons, usually as a result of Delaunay triangulation.

<div>
    <img src="blog-posts/PathFindingPrinciples/navmesh.png" width="300"/>
</div>
<br>

Pros:
* Precise enough for games
* Provides enough flexibility for a smooth movement
* Not as expensive as a grid

Cons:
* Hard to implement
* Dynamic changes are expensive
* Hard localization


### 2. Voxelization
Using as a reference the following paper, let's dive into the first step for a Navmesh, which is Voxelization.
> [Saupin, Guillaume & roussel, oliviel & Le Garrec, Jérémie. (2013). Robust and Scalable Navmesh Generation with multiple levels and stairs support. ](https://www.researchgate.net/publication/276886559_Robust_and_Scalable_Navmesh_Generation_with_multiple_levels_and_stairs_support)

Overall, the paper defines these steps as needed for a robust navmesh generation:
1. Voxelization
2. Vertical Segmentation
3. Regions
4. Define contours(the hard part)
5. Set region neighbourhood

<br/>

#### 2.1 Voxelization and vertical segmentation
It's important to have a basic, raw representation of the world you want to navigate. Voxels are the 3D version of pixels, think of them like cubes.

The first step is setting voxels to proccess the world. For such reason, you should gather a list of the objects you want to represent in your graph.

Why? Because we must know where to search in the first place. Otherwhise, we should check the whole world through collision-checks, and that would be insane. Unity provides a good 
tool for such purpose, which is Collider.bounds. Through bounds, we are able to know where a collider "starts", and where it "ends" as a fully containing box. That means the box doesn't adjust perfectly to "non-cubic" shapes, but it is not that big of a problem.

So, you should define a function to check the collision of an object in its full area. And, *somehow, know when it is walkable*.

<br/>

#### 2.2 Somehow know when it is walkable
When it is on top, of course! Still, storing huge ammounts of stacked up non-top useless voxels is not ideal. For that reason, we will keep track of the highest
and lowest coordinate of such span.

<div class>
    <img src="blog-posts/PathFindingPrinciples/Unitybasis.png" class="rounded"/>
</div>

<br/>

Keep in mind that when it comes to Unity, X and Z axis are horizontal. while Y is vertical.

*What is a span?* A span is a vertical colliding section in horzintal (X,Y)coordinates, so there can be many "spans" in a single "tile". From now on, let's call tile to a (X,Z) location, with all its (Y)vertical spans.

<div class>
    <img src="blog-posts/PathFindingPrinciples/Tilescheme.png" class="rounded" width="600"/>
</div>

<br/>

For each tile, store its vertical spans. Each vertical span, has its maxY coordinate and minY coordinate. For that reason, keep a list of spans in each tile.
If a voxel detects as colliding, you have a new span. But, if threre is an existing span contiguous span, expand the minY or maxY of such span and don't add a new span to the list.

<br/>

```cs
    
    public void CheckSpans(Collider collider)
    {
        // Get size of bounds in voxels
        int yMin = Mathf.RoundToInt(collider.bounds.min.y / voxelSize);
        int yMax = Mathf.RoundToInt(collider.bounds.max.y / voxelSize);

        for (int i = yMin - 1; i <= yMax; i++)
        {
            var offset = Vector3.up * voxelSize * i;
            var colliders = Physics.OverlapSphere(position + offset, voxelSize * 0.5f, walkableLayer);

            if (colliders.Length != 0)
            {
                bool existing = false;
                foreach (var span in spans)
                {
                    //If is inside
                    if ((i <= span.maxY && i >= span.minY) || i == span.maxY || i == span.minY)
                    {
                        existing = true;
                    }
                    //If is in top borders, expand such borders
                    else if (i == (span.maxY + 1))
                    {
                        existing = true;
                        span.maxY += 1;
                    }
                    //If is in bottom border, expand such borders
                    else if (i == (span.minY - 1))
                    {
                        existing = true;
                        span.minY -= 1;
                    }

                }

                // if no existing span covers this voxel
                if (existing == false)
                {
                    //Create span for this voxel
                    var newSpan = new VoxelSpan(i, i, coordinates, VoxelType.Walkable);
                    spans.Add(newSpan);
                }
            }
        }
    }
```
<br/>

The above function is executed in every tile. All what's left is executing is in evey possible tile that covers every collider in our list.

<br/>

```cs
Dictionary<Vector2Int, VoxelTile> voxelTiles;
List<Collider> colliders;

LayerMask walkableLayer;
float voxelSize;

void Voxelize()
{
    // colliders are those colliding object we don't ignore for our mesh
    foreach (Collider collider in colliders)
    {
        var bounds = collider.bounds;

        //Get horizontal size in voxels
        var xSize = Mathf.RoundToInt(bounds.size.x / voxelSize);
        var zSize = Mathf.RoundToInt(bounds.size.z / voxelSize);

        //Get where it starts in voxel coordinates
        var xMin = Mathf.RoundToInt(bounds.min.x / voxelSize);
        var zMin = Mathf.RoundToInt(bounds.min.z / voxelSize);

        for (int i = 0; i <= xSize; i++)
        {
            for (int j = 0; j <= zSize; j++)
            {
                var coords = new Vector2Int(xMin + i, zMin + j);

                // If there is already a tile in such location
                if (voxelTiles.TryGetValue(coords, out var voxelTile))
                {
                    voxelTile.CheckSpans(collider);
                }
                else
                {
                        //Create a new tile
                    var newVoxelTile = new VoxelTile(coords, voxelSize, walkableLayer);
                    newVoxelTile.CheckSpans(collider);

                    // If the new tile has at least one span(Remember that bounds are rough volumes which contain a collider, there is a lot of empty space)
                    if (newVoxelTile.spans.Count != 0)
                    {
                        voxelTiles.Add(coords, newVoxelTile);
                        voxelList.Add(newVoxelTile);
                    }
                }

            }

        }
    }

    //Merge those spans which are adyacent
    foreach (var tile in voxelTiles.Values)
    {
        tile.MergeSpans();
    }
}
```

<br/>

That's pretty much everything. You may be wondering what is tile.MergeSpans(). That function merges spans which are next to other spans from their own tile.

```cs
public void MergeSpans()
{
    //Lower maxY goes first
    spans.Sort(delegate (VoxelSpan a, VoxelSpan b)
    {
        if (a.maxY < b.maxY) return 1;
        if (b.maxY < a.maxY) return -1;
        
        return 0;
    });

    for (int i = 0; i < spans.Count - 1; i++)
    {
        bool remove = false;
        if (spans[i].minY <= spans[i + 1].maxY)
        {
            spans[i].minY = spans[i + 1].minY;
            remove = true;
        }
        else if (spans[i].minY <= spans[i + 1].minY)
        {
                remove = true;
        }

        if (remove)
        {
            spans.RemoveAt(i + 1);
            i--;
        }
    }
}
```

<br/>


I highly recommend you invest some time at visual representation from now on. Every time you update your navmesh project, make sure it is correclty drawn in your gizmos, because you truly can't check your results without a reliable gizmos.

<br/>

```cs
private void OnDrawGizmos()
{
    if (voxelTiles != null && voxelTiles.Count != 0)
    {
        foreach (var tile in voxelTiles.Values)
        {
            var tilePosition = new Vector3(tile.coordinates.x * voxelSize, 0, tile.coordinates.y * voxelSize);
            foreach (var span in tile.spans)
            {
                Gizmos.color = Color.red;

                var ySize = span.maxY - span.minY + 1;
                var yPosition = (span.maxY + span.minY) * 0.5f * voxelSize;

                var position = tilePosition;
                position.y = yPosition;

                Gizmos.DrawWireCube(position, new Vector3(voxelSize, ySize * voxelSize, voxelSize));

            }
        }
    }
}


```

<br/>

There you have it! 

<div>
    <img src="blog-posts/PathFindingPrinciples/Simplevoxel.png"/>
</div>

<br/>

Take a look at the at that floating blue volume and its voxelization. It is covered by single cubic shapes made from voxels, with separated spans below it which is contained aswell in the same tiles.
