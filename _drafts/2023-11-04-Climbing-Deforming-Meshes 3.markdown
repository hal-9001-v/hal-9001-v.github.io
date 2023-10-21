---
layout: post
title: Climbing Deforming Meshes - Part Three, Enhancing Performance
date: 2023-03-10 00:00:21 +0300
description: Exploring methods to boost your climbing system's performance.
img: Deformingmeshes/AttachedTriangle.png
fig-caption: 
tags: [Unity, Learning, Climbing]
category: Unity
---

The art of climbing deforming meshes is no longer a well-kept secret. In this installment, we'll delve into optimizing your climbing system's performance and add an element of challenge by introducing ledges. Ledges can make your climbs more intricate, although they might not always be necessary, particularly when dealing with deforming meshes. We'll cover the use of ledges in the next chapter.

Keep in mind that this chapter should be considered optional. Its relevance depends on the project's complexity and performance requirements. Modern CPUs are quite forgiving in most cases, so the decision to implement these measures is ultimately up to you.

# Simplifying Complex Meshes #
One of the most straightforward steps is to create a simplified collision mesh for updates. If your model is highly detailed and you don't want your character to resemble a 3D PS1 character, there's no need to fret. Games like "Shadow of the Colossus" used a highly simplified collision mesh beneath their high-poly models. The key is to render the high-poly model while using the simplified model for collisions. Players are unlikely to notice the difference.

<div class="text-center">
    <img src="{{site.baseurl}}/assets/img/PathfindingIntro/Sil.png" class="rounded" width="500"/>
</div>

Culling Unnecessary Calculations
The climbing system can be resource-intensive because the meshes deform, necessitating frequent collider updates. The level of resource consumption depends on the complexity of the collision mesh. To reduce the computational load, consider updating only those colliders within a certain range of the player's interaction. Instead of calculating distances between the player and each triangle of every climbable MeshCollider, it's more efficient to check the distance to the collider's center.

To implement this, create a "MeshColliderUpdater" component. This component will update all the "MeshCollidersUpdate" components within a certain range.

public static Vector3 GetClosestPointFromSegment(Vector3 p, Vector3 a, Vector3 b)
{
    // Your code here
}
Segmenting the Collision Mesh
Similar to optimizing colliders, you can divide the colossus's body into multiple colliders, each with its MeshColliderUpdate component. This segmentation reduces the portion of the body that requires updates.

<div class="text-center">
    <img src="{{site.baseurl}}/assets/img/PathfindingIntro/Sil.png" class="rounded" width="500"/>
</div>


# Using Multiple Update Profiles #
Not all climbable bodies may require the same update frequency. Consider creating multiple update profiles or manually adjusting the update rate per second based on your specific needs.

# Conclusion #
In this chapter, we explored ways to improve the performance of your climbing system. By simplifying collision meshes, culling unnecessary calculations, segmenting the collision mesh, and utilizing multiple update profiles, you can enhance the player's climbing experience while maintaining optimal performance.