---
layout: post
title: Climbing Deforming Meshes - Part Three, Enhancing Performance
date: 2023-03-10 00:00:21 +0300
description: Exploring methods to boost your climbing system's performance
img: DeformingMeshes/AttachedTriangle.png
fig-caption: 
tags: [Unity, Learning, Climbing]
category: Unity
---

In this chapter, we will explore some simple ideas to improve the performance of your climbing system. We'll cover the use of ledges in the next chapter, since these are optional to a climbing system. In fact, if I recall correctly, Praey for the Gods does not make use of them.

Ledges can make your climbs more intricate, although they might not always be necessary, particularly when dealing with deforming meshes. For that reason, check the next chapter after implementing some of the features of this one.

Keep in mind that this chapter should be considered "optional". Its relevance depends on the project's complexity and performance requirements. Modern CPUs are quite forgiving in most cases, so the decision to implement these measures is ultimately up to you.

# Simplifying Complex Meshes #
One of the most straightforward(and vital) steps is to create a simplified collision mesh for updates. If your model is highly detailed and you don't want your character to resemble a 3D PS1 character, there's no need to fret. Games like "Shadow of the Colossus" used a highly simplified collision mesh beneath their high-poly models. The key is to render the high-poly model while using the simplified model for collisions. 


<div class="text-center">
    <img src="{{site.baseurl}}/assets/img/DeformingMeshes3/PolyComparison.png" class="rounded" width="500"/>
</div>


Players are unlikely to notice the difference. Comparing the two models ripped from the original game, the difference is huge. As a note, the collision model doesn't feature "fingers". It just uses a very thick hand, with no fingers since the gameplay doesn't really interact with them.


# Culling Unnecessary Calculations #
The climbing system can be resource-intensive because the meshes deform, necessitating frequent collider updates. The level of resource consumption depends on the complexity of the collision mesh. To reduce the computational load, consider updating only those colliders within a certain range of the player's interaction. 

Instead of calculating distances between the player and each triangle of every climbable MeshCollider, it's more efficient to check the distance to the collider's center.

To implement this, create a "MeshColliderUpdaterTrigger" component. This component will update all the "MeshCollidersUpdate" components within a certain range. 

# Segmenting the Collision Mesh #
Similar to simplying colliders, you can divide the colossus's body into multiple colliders, each with its MeshColliderUpdate component. This segmentation reduces the portion of the body that requires updates, given the case that you implement some culling.

Anyways, this measure might be too much in some cases. I am not sure if SotC used this measure, but it makes sense in my head considering that the game had performance problems and this trick surely got into their heads.

# Using Multiple Update Profiles #
Not all climbable bodies may require the same update frequency. Consider creating multiple update profiles or manually adjusting the update rate per second based on your specific needs. For example, those deforming meshes that change constantly and are supposed to be interacted by the player, use a high quality setting. For those cases you want, let's say, an arrow stuck in a distant mesh, use a low profile quality.

The next code is an extension of the previous' chapter MeshColliderUpdater. It simply adds a condition for the update.

```cs
class MeshColliderUpdater{

    public enum MeshUpdateQuality
    {
        LowQuality,
        MediumQuality,
        HighQuality
    }

    [SerializeField] MeshUpdateQuality quality;
    float lastUpdate;
    
    void Update()
    {
       if (Time.time - lastUpdate > GetPeriod(quality))
        {
            lastUpdate = Time.time;
            UpdateCollider();
        }    
    }

    //This is not an elegant way to select qualities, and you might prefer to use a variable to indicate the updates per second directly.
    float GetPeriod(MeshUpdateQuality quality)
    {
        switch (quality)
        {
            case MeshUpdateQuality.LowQuality:
                return 1f/15;
            case MeshUpdateQuality.MediumQuality:
                return 1f/30;
            case MeshUpdateQuality.HighQuality:
                return 1f/60;
        }

        return 1;
    }
}

```

# Conclusion #
In this chapter, we explored ways to improve the performance of your climbing system. By simplifying collision meshes, culling unnecessary calculations, segmenting the collision mesh, and utilizing multiple update profiles, you can enhance the player's climbing experience while maintaining optimal performance.