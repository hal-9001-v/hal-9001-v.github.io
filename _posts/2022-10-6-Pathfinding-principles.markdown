---
layout: post
title: Intro to PathFinding's space
date: 2022-10-6 00:00:20 +0300
description: Gathering info is important.
img: pathfinding.png # Add image post (optional)
fig-caption: # Add figcaption (optional)
tags: [Unity, Learn, Pathfinding]
category: Unity
---

This is it. I got to the end of my University Degree and now it's time to make a Final Degree Proyect. I chose Pathfinding!

### Context
Some time ago, I tried to develop a project with a few friends. Such game was completely inspired by the Sly Cooper games and I was so excited! Yet, it did not
work out(but hey, I learnt a lot).

One of the (many) problems I faced was Unity's Navmesh tool. Sure, it worked pretty well! In just a moment, I had my bad guys moving around with so little effort.
BUT, wasn't it too easy? Since it was made to be quickly implemented, it lacked flexibility.

<br/>

### Problem
I wanted guard to fly around everytime the player hit them. That implied disabling the navigation, applying some physics and finally enabling the navigation. Easy, right?

Well, no. For some reason, warping again the agent into the navmesh wasn't so easy. Actually, it was painfully tricky. I needed to play around with some functions with no reasoning but a trial-error proccess I found on the web.

<div class="text-center">
    <img src="{{site.baseurl}}/assets/img/PathfindingIntro/Sil.png" class="rounded" width="500"/>
</div>

<br/>


### Solution
Hey, I have to make a proyect for college. Hey, I also have this problem with Unity's navmesh... what if... yeah. Anyways, I decided to keep record of my work in this blog.

Let's get into it.

<br/>

### The Basics
It goes like this:

* Agents(bad guys, animals...) want to move around in space.
* Space has to be represented in code so it is easily interpreted.
    * This is the hard part. This task could be divided in:
        * Figuring out what the enviroment's collisions mean for the agents's navigation
        * Gathering that info in a discretized way
* Agents take that space representation and find the best path for their purpose.

#### Space
I have no idea for now how to procedurally read the environment to make a discretized representation, but I what I know is some of the ways to represent the environment!

> Take a look at Nathan R. Sturtevant's Game AI Pro 360P's Search Space Representation

##### Grid
This one is the easiest. It simply makes an uniform net wich covers all the space. If there is wall in (X,Y), then grid[x][y] = Wall. This is really easy for manual changes, since it could be easily represented in a text file.

<div>
    <img src="{{site.baseurl}}/assets/img/PathfindingIntro/grid.png" class="rounded" width="300"/>
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
#### Waypoints
The waypoint representation usually depends on the manual side. Devs put transitable points in the map, connecting them. This implies a low-cost solution, with "easy" implementation.

<div>
    <img src="{{site.baseurl}}/assets/img/PathfindingIntro/waypoints.png" class="rounded" width="300"/>
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


#### Navigation Mesh
Here comes the star. Navmesh consist in a world representation through polygons, usually as a result of Delaunay triangulation.

<div>
    <img src="{{site.baseurl}}/assets/img/PathfindingIntro/navmesh.png" class="rounded" width="300"/>
</div>
<br>
Pros:
* Precise enough for games
* Provides enough flexibility for a smooth movement
* Not as expensive as a grid

Cons:
* Hard to implement
* Dynamic hanges are expensive
* Hard localization