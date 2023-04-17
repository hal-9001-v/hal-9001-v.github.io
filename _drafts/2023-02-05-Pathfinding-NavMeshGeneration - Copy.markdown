---
layout: post
title: Navmesh generation Part Two - Simple Triangulation
date: 2023-01-5 00:00:20 +0300
description: From expensive voxels, to cheap polygons/triangles.
img: PathfindingDelaunayOne/sceneTriangulation.png
fig-caption: # Add figcaption (optional)
tags: [Unity, Learn, Pathfinding]
category: Unity
---

Now, this is a huge change. First, I want to point out something before you do. You may have seen those triangles in the thumbnail whose edges are out of the "map". Indeed, those edges shouldn't be there for our game, considering that every triangle is a node in our pathfinding graph. I will try to fix that problem in the future, of course.

## Triangulation. Why? ##
I asked that to myself a few times. In the previous article, I wrote about voxelizing the environment, and believe it or not, that was enough for our pathfinding to work. Really, it was.

<div class>
    <img src="{{site.baseurl}}/assets/img/Pathfindingvoxel/Simplevoxel.png" class="rounded" width="600"/>
</div>

<br>
Just move around tiles like a classic 2d board game. We would just need to locate the closest voxel to our path's origin, and the same for our destination. Pass it to your local pathfinding algorithm and *"boom!"*. But wouldn't that be expensive. Accurate voxelization would rocket our memory and CPU costs sky-high, hardly working on big scenes.

It is way more viable to simplify that voxelization into accurate bounds. That is, finding their corners and making polygons out of them, so you can easily find out our polygon(which would group many of our voxels each with accuracy) and find your path through polygons.

## What polygon? ##
There are many ways to polygonyze a set of points. The most obvious solution are triangles, the most basic polygon. That's where Delaunay triangulation makes its entrance, since it is a highly standarized mesh formation, with tons of documentation and quality contnrol.

*Anyways, what is a Delaunay triangulation?* [There is plenty of explanations on the web for this subject](https://en.wikipedia.org/wiki/Delaunay_triangulation). Basically, it's a mesh of triangle whose triangles' circumradius only reachs the vertices of its own triangle, no other's.

## Finding corners ##
Corners are vital for this concept, since they provide all the information about the terrain's shape we care. They will give us a contour, a polygon so to speak.

<div class>
Meter aqui un dibujito de un grid con esquinas
    <img src="{{site.baseurl}}/assets/img/Pathfindingvoxel/Simplevoxel.png" class="rounded" width="600"/>
</div>