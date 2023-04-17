---
layout: post
title: Climbing Deforming Meshes - Part Two, Maths
date: 2023-01-5 00:00:21 +0300
description: The basic workings of SotC's climbing
img: Deformingmeshes/AttachedTriangle.png
fig-caption: # Add figcaption (optional)
tags: [Unity, Learn, Pathfinding]
category: Unity
---

Last chapter we talked about the approach we should take, we can start implementing it. Let's go through the steps needed to achieve a climbing system like SotC:

1. Identify the closest triangle
The first step to create our local system is to find the closest triangle to the player. We need to check for collision with each triangle of the mesh and determine which is the closest one.

We can achieve this by using raycasting. We cast a ray from the player's position and check for collisions with each triangle. The closest triangle will be the one with the shortest distance from the player to the intersection point of the ray and the triangle.

Once we have identified the closest triangle, we can proceed to the next step.

2. Map the movement of the triangle to the player
Now that we know which triangle the player is closest to, we need to map the movement of the triangle to the player. As the triangle deforms, we want the player to move along with it.

We can achieve this by calculating the barycentric coordinates of the player's position in relation to the triangle. Barycentric coordinates are a way of expressing a point as a weighted sum of the triangle's vertices.

Using these coordinates, we can calculate the position of the player on the triangle as it deforms. We can also calculate the player's normal vector based on the average normal of the triangle's vertices. This is important for determining the orientation of the player as it moves along the triangle.

3. Apply forces to the player
With the player position and normal mapped to the deforming triangle, we can apply forces to the player to simulate climbing. The forces applied will depend on the direction the player is moving, as well as the orientation of the triangle.

We can simulate climbing by applying normal forces to the player as it moves along the triangle. We can also use friction forces to simulate the resistance of the surface. Additionally, we can apply gravity forces to the player to simulate the effect of gravity on the climb.

4. Adjust the camera
As the player moves along the deforming triangle, we need to adjust the camera to follow the action. We can achieve this by calculating the camera position and orientation based on the position and normal of the player on the triangle.

We can use a third-person camera system that follows the player and adjusts its position and orientation based on the position and orientation of the player.

Conclusion
Implementing a climbing system like the one in SotC is no easy feat, but with a solid understanding of the problem and a clear approach, it is possible. By mapping the movement of the deforming mesh to the player and applying forces accordingly, we can simulate the experience of climbing a giant creature like a colossus.

In the next chapter, we will address some performance issues that may arise and some other problems that need to be solved to make the climbing system as smooth and realistic as possible.