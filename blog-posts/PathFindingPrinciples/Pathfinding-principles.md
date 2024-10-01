<link rel="stylesheet" type="text/css" href="blog-posts/blog.css">

### 1. Intro

This is it. I got to the end of my University Degree and now it's time to make a Final Degree Proyect. I chose Pathfinding! So here goes another guide about pathfinding!

#### 1.1 Context
Some time ago, I tried to develop a project with a few friends. The game was entirely inspired by the Sly Cooper series, and I was so excited! Unfortunately, it didn't work out—but hey, I learned a lot.

One of the many problems I faced was Unity's NavMesh tool. Sure, it worked pretty well! In no time, I had my bad guys moving around with very little effort. But then, some issues started to arise.
<br/>

#### 1.2 Problem
I wanted the guards to fly around whenever the player hit them. That required disabling the navigation, applying some physics, and then re-enabling the navigation.

For some reason, warping the agent back onto the NavMesh wasn’t as easy as I expected. In fact, it was painfully tricky. I had to experiment with some functions I found online through a trial-and-error process that sometimes worked and sometimes didn’t.

<div>
    <img src="blog-posts/PathfindingPrinciples/Sil.png" width="500"/>
</div>

<br/>

#### 1.3 The Basics
It goes like this:

* Agents (bad guys, animals, etc.) need to navigate through space.
* Space must be represented in code so that it can be easily interpreted by the agents.
    * This is the challenging part, which can be broken down into:
        * Understanding how the environment’s collisions affect the agents' navigation.
        * Organizing that information in a discretized and easily manipulable format.
* Organizing that information in a discretized and easily manipulable format.

> Take a look at Nathan R. Sturtevant's Game AI Pro 360P's Search Space Representation

##### 1.4 Grid
This one is the easiest. It simply makes an uniform net wich covers all the space. If there is wall in (X,Y), then grid[x][y] = Wall. This is really easy for manual changes, since it could be easily represented in a text file.

<div>
    <img src="blog-posts/PathfindingPrinciples/grid.png" width="300"/>
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

The waypoint representation usually relies on manual input. Developers place navigable points on the map and connect them. This provides a low-cost solution with relatively "easy" implementation
<div>
    <img src="blog-posts/PathfindingPrinciples/waypoints.png" width="300"/>
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
Here comes the star: NavMesh represents the world using polygons, typically generated through Delaunay triangulation.

<div>
    <img src="blog-posts/PathfindingPrinciples/navmesh.png" width="300"/>
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

So, like many implementations before me, I’m going to explore and detail the development of a custom NavMesh pathfinding tool.

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
It's important to have a basic, raw representation of the world you want to navigate. Voxels are the 3D equivalent of pixels—think of them as tiny cubes that make up the environment.

The first step is to set up voxels to process the world. To do this, you need to gather a list of the objects you want to represent in your graph.

Why? Because we need to know where to search initially. Otherwise, we would have to check the entire world through collision checks, which would be impractical. 
Unity provides a useful tool for this purpose: Collider.bounds. Using bounds, we can determine where a collider starts and ends as a fully enclosing box.
While this box doesn’t perfectly adjust to non-cubic shapes, it’s generally not a major issue.

So, you should define a function to check collisions for an object across its entire area. Additionally, you need a way to *determine whether the area is walkable*.

<br/>

#### 2.2 Determine whether the area is walkable
When it's on top, of course! However, storing large amounts of stacked non-top voxels isn't ideal. For this reason, we'll keep track of the highest and lowest coordinates of the span.

<div class>
    <img src="blog-posts/PathfindingPrinciples/Unitybasis.png" class="rounded"/>
</div>

<br/>

Keep in mind that in Unity, the X and Z axes are horizontal, while the Y axis is vertical.

*What is a span?* A span is a vertical section of collision within horizontal (X, Z) coordinates. This means there can be multiple "spans" within a single "tile." From now on, we'll refer to a tile as a specific (X, Z) location, along with all its associated vertical spans (Y).

<div class>
    <img src="blog-posts/PathfindingPrinciples/Tilescheme.png" class="rounded" width="600"/>
</div>

<br/>

For each tile, store its vertical spans. Each vertical span should have a maximum Y coordinate and a minimum Y coordinate. Therefore, maintain a list of spans for each tile.
If a voxel detects a collision, it represents a new span. However, if there is an existing contiguous span, you should expand the minimum Y or maximum Y of that span rather than adding a new span to the list.
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

The above function is executed for every tile. What's left is to apply this process to every possible tile that covers each collider in our list.

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

That’s pretty much everything. You might be wondering about the `tile.MergeSpans()` function. This function merges spans that are adjacent to other spans within the same tile.

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


I highly recommend investing some time in visual representation from now on. Each time you update your NavMesh project, make sure it is accurately displayed in your gizmos. You truly can't verify your results without a reliable gizmo visualization.
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

<div>
    <img src="blog-posts/PathfindingPrinciples/Simplevoxel.png"/>
</div>

<br/>

Take a look at that floating blue volume and its voxelization. It is covered by individual cubic shapes made from voxels, with separate spans below it that are also contained within the same tiles.

### 3. Conclusion
In this chapter, I covered the first step for creating a NavMesh pathfinding tool: voxelization. This technique is foundational and can be utilized by many different approaches. The next chapter will delve into the following step: triangulation and more!