---
layout: post
title: Climbing Deforming Meshes - Part One
date: 2023-01-5 00:00:20 +0300
description: One of the most iconic games in history's big secret
img: DeformingMeshes/SOTC.png
fig-caption: # Add figcaption (optional)
tags: [Unity, Learn, SotC]
category: Unity
---
As a member of the BTFL project, I was tasked with the challenge of creating a climbing system similar to that of Shadow of the Colossus (SotC). It proved to be a complex problem. Since I could not find sufficient information online, I made a three-chapter tutorial to simplify the issue for future programmers who come across this same problem.

Chapter 1 introduces the problem and covers the fundamental solution, while chapter 2 covers implementing the solution, and chapter 3 deals with the resolution of performance issues and troubleshooting any problems.

<br>

## What is this all about ##
In SotC, the player navigates giant creatures known as colossi. Each colossus serves as an interactive puzzle, requiring a specific climbing technique to be solved effectively. The animation of these colossi is magnificent, incorporating both FK and procedural movements, allowing the game to apply climbing to an ever-changing environment, far from other games' simple wall climbing.

<br>
<div class>
    <img src="{{site.baseurl}}/assets/img/DeformingMeshes/ClimbingExamples.png" class="rounded" width="600"/>
</div>

*This kind of thing has been around for quite a long time.*

<br>

SotC is a technical masterpiece that is challenging to compare to other games even now, and these tutorials focus on the technical aspects while acknowledging the game's impressive visuals.

## The problem ##
The issue at hand is maneuvering the player character through the deforming high-poly mesh that comprises the colossus's body. Climbing a static mesh is easy in comparison, as the wall's movement can be adpated through parenting the player to the wall. In contrast, the colossus mesh is a far more complicated, deforming entity affected by weighted sums of the nearby bones' transform, making climbing quite a problem.

<br>
<div class>
    <img src="{{site.baseurl}}/assets/img/DeformingMeshes/climbing.gif" class="rounded" width="600"/>
</div>
<br>
*Thanks to Jaikhay for this gif from the early stages of the game.*


## The basic solution ## 
We can't parent the player to a bone. So, what should we do?

<br>
<div class>
    <img src="{{site.baseurl}}/assets/img/DeformingMeshes/AttachedTriangle.png" class="rounded" width="600"/>
</div>
*Take the cube as your player, and the green model as your colossus. <br>Thanks to the BTFL project for this screenshot.*

<br>
The basic solution involves parenting the player to the closest triangle in the mesh. While parenting the player to a point would be pointless(pun intended) since points can't be rendered, triangles offer a visual representation which contains all the 3D information we need. This way, we allow the player to adapt to the changes in the mesh, leading to a local system based on the closest triangle to the player. 

The next chapter will focus on the mathematical aspect of this solution.