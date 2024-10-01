---
layout: post
title: Navmesh generation Part One - Voxelization
date: 2022-10-6 00:00:20 +0300
description: Voxelize a 3D world in Unity
img: Pathfindingvoxel/Simplevoxel.png # Add image post (optional)
fig-caption: # Add figcaption (optional)
tags: [Unity, Learn, Pathfinding]
category: Unity
---

In the [previous article](https://hal-9001-v.github.io/Pathfinding-principles/), I talked about the options of representation for 3D space. Basically, they were:
* Grid: easy but expensive representation with clunky results.
* Waypoints: easy and cheap, not your flexible choice.
* Navmesh: probably the most working choice. Hard to make, though.

There are many ways to get a Navmesh. For now, I have been studying this paper:

> [Saupin, Guillaume & roussel, oliviel & Le Garrec, Jérémie. (2013). Robust and Scalable Navmesh Generation with multiple levels and stairs support. ](https://www.researchgate.net/publication/276886559_Robust_and_Scalable_Navmesh_Generation_with_multiple_levels_and_stairs_support)


Still, I just haven't been able to make it work nor understand it (anyways, I am grateful for their work). So, I decided that making a tutorial for dummies like me will serve as my redemption.

Steps:
1. Voxelization
2. Vertical Segmentation
3. Regions
4. Define contours(the hard part)
5. Set region neighbourhood

<br/>

## Voxelization and vertical segmentation
It's important to have a basic, raw representation of the world you want to navigate. Voxels are the 3D version of pixels, think of them like cubes.

The first step is setting voxels to proccess the world. For such reason, you should gather a list of the objects you want to represent in your graph.

Why? Because we must know where to search in the first place. Otherwhise, we should check the whole world through collision-checks, and that would be insane. Unity provides a good 
tool for such purpose, which is Collider.bounds. Through bounds, we are able to know where a collider "starts", and where it "ends" as a fully containing box. That means the box doesn't adjust perfectly to "non-cubic" shapes, but it is not that big of a problem.

So, you should define a function to check the collision of an object in its full area. And, *somehow, know when it is walkable*.

<br/>

### Somehow know when it is walkable
When it is on top, of course! Still, storing huge ammounts of stacked up non-top useless voxels is not ideal. For that reason, we will keep track of the highest
and lowest coordinate of such span.

<div class>
    <img src="{{site.baseurl}}/assets/img/Pathfindingvoxel/Unitybasis.png" class="rounded"/>
</div>

<br/>

Keep in mind that when it comes to Unity, X and Z axis are horizontal. while Y is vertical.

*What is a span?* A span is a vertical colliding section in horzintal (X,Y)coordinates, so there can be many "spans" in a single "tile". From now on, let's call tile to a (X,Z) location, with all its (Y)vertical spans.

<div class>
    <img src="{{site.baseurl}}/assets/img/Pathfindingvoxel/Tilescheme.png" class="rounded" width="600"/>
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
    <img src="{{site.baseurl}}/assets/img/Pathfindingvoxel/Simplevoxel.png" class="rounded"/>
</div>

<br/>

Take a look at the at that floating blue volume and its voxelization. It is covered by single cubic shapes made from voxels, with separated spans below it which is contained aswell in the same tiles.
