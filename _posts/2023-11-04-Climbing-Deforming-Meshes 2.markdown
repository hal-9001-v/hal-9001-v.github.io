---
layout: post
title: Climbing Deforming Meshes - Part Two, Maths
date: 2023-03-10 00:00:21 +0300
description: The basic workings of SotC's climbing
img: Deformingmeshes/AttachedTriangle.png
fig-caption: # Add figcaption (optional)
tags: [Unity, Learn, Pathfinding]
category: Unity
---

Last chapter we talked about the approach we should take. Let's go through the steps needed to achieve it:

1. Identify the closest triangle
2. Make a coordinate system out of that triangle
3. Update the player's position according to the current status of that triangle
4. Apply the movement


## Identify the closest triangle ##
The first step to create our local system is to find the closest triangle to the player. That is, we have to find a way to get the closest triangle from the deforming mesh at hand.

We can achieve this by using raycasting. We cast a ray from the player's position and check for collisions, and try to get the closest one. This function can be implemented in several way, it's up to you. For instance, we can just make a raycast from the player to the origin of the body, which might work for now.

But that approach might not always work. For that reason, we can use some code to find the closest point from a MeshCollider component, so we raycast in the direction of that point. I will not explain the workings of this code since that would take a long time and I don't consider myself the best person to do so.

```cs
    
      public static Vector3 GetClosestPointFromMeshCollider(Vector3 position, MeshCollider meshCollider)
    {
        var vertices = meshCollider.sharedMesh.vertices;
        var triangles = meshCollider.sharedMesh.triangles;
        var normals = meshCollider.sharedMesh.normals;

        var localPosition = meshCollider.transform.InverseTransformPoint(position);

        Vector3 closest = new Vector3();
        var closestDistance = float.MaxValue;
        for (int i = 0; i < triangles.Length; i += 3)
        {
            var a = vertices[triangles[i]];
            var b = vertices[triangles[i + 1]];
            var c = vertices[triangles[i + 2]];

            var aNormal = normals[triangles[i]];
            var bNormal = normals[triangles[i + 1]];
            var cNormal = normals[triangles[i + 2]];

            var normal = (aNormal + bNormal + cNormal) / 3;

            var newClosest = GetClosestPointFromTriangle(localPosition, a, b, c, normal);
            var newDistance = Vector3.Distance(newClosest, localPosition);
            if (newDistance < closestDistance)
            {

                closestDistance = newDistance;
                closest = newClosest;
            }

        }
        return meshCollider.transform.TransformPoint(closest);
    }

    public static Vector3 GetClosestPointFromTriangle(Vector3 p, Vector3 a, Vector3 b, Vector3 c, Vector3 normal)
    { // calculate edges of triangle
        Vector3 AB = b - a;
        Vector3 BC = c - b;
        Vector3 CA = a - c;

        // calculate point on plane of triangle closest to given point
        var planePoint = p - normal * Vector3.Dot(normal, p - a);

        // check if planePoint is inside the triangle
        Vector3 AP = planePoint - a;
        Vector3 BP = planePoint - b;
        Vector3 CP = planePoint - c;

        var crossAB = Vector3.Cross(AB, AP);
        var dotAB = Vector3.Dot(crossAB, normal);

        var crossBC = Vector3.Cross(BC, BP);
        var dotBC = Vector3.Dot(crossBC, normal);

        var crossCA = Vector3.Cross(CA, CP);
        var dotCA = Vector3.Dot(crossCA, normal);

        // calculate closest point on triangle to given point
        Vector3 closestPoint = planePoint;

        if (dotAB < 0f)
        { // closest point is on edge AB
            closestPoint = GetClosestPointFromSegment(p, a, b);
        }
        else if (dotBC < 0f)
        { // closest point is on edge BC
            closestPoint = GetClosestPointFromSegment(p, b, c);
        }
        else if (dotCA < 0f)
        { // closest point is on edge CA
            closestPoint = GetClosestPointFromSegment(p, c, a);
        }

        return closestPoint;
    }

    public static Vector3 GetClosestPointFromSegment(Vector3 p, Vector3 a, Vector3 b)
    {
        Vector3 ab = b - a;
        float t = Vector3.Dot(p - a, ab) / Vector3.Dot(ab, ab);
        t = Mathf.Clamp01(t);

        return a + t * ab;
    }



```

<br>
Once we have identified the closest point, use a raycast from the player to the point.

## Update the collider ##
You can skip this step for now if you want to test the climbing over unanimated models. But, if you do use animations, you must make sure that the collision mesh gets updated to the changes caused by the animations. Otherwise, the collision won't match the current status of the model, since it will keep the initial shape of it.

Unity won't do that for you on its own. But don't worry, fixing this is really easy. For each of the deforming meshes in the scene, use this component.

```cs
    
    class SkinnedMeshCollisionUpdater : MonoBehaviour{

        SkinnedMeshRenderer renderer => GetCompnent<SkinnedMeshRenderer>();
        MeshCollider collider => GetComponent<MeshCollider>();
        Mesh colliderMesh;

        void Awake()
        {
            colliderMesh = new Mesh();   
        }

        void Update()
        {
            UpdateCollider();
        }

        public void UpdateCollider()
        {
            //Create a new collision mesh
            meshRenderer.BakeMesh(colliderMesh, true);
            
            // Scrap the previous mesh for collision
            Col.sharedMesh = null;
            //Update the collision to the new mesh
            Col.sharedMesh = colliderMesh;
        }
    }
```
This code can become expensive if used on complex meshes. For that reason, you may want to optimize it, updating only when needed.

## Map the movement of the triangle to the player ##
Now that we know which triangle the player is closest to, we need to map the movement of the triangle to the player. As the triangle deforms, we want the player to move along with it.

We can achieve this by calculating the barycentric coordinates of the player's position in relation to the triangle. Barycentric coordinates are a way of expressing a point as a weighted sum of the triangle's vertices. The limitation of this system is we can't use it to store points that do not belong to the planed defined by the triangle. We would need a tethaedron for that, but don't worry we can work around this problem.

Under these circumstances, we have to find out the closest point in the triangle's plane that is closest to our player. If we are using raycasts for this climbing system, we can just use the hit point for that. On top of that, Unity's RaycastHit struct not only includes the hit point, but the barycentric coords too. So you really should consider using raycasts.

```cs
    
    Vector3 baryCoords;
    Vector3Int triangleIndexes;

    public Vector3 FindClosestPoint(MeshCollider collider)
    {
        ...
    }

    public Vector3 GetUpdatedClimbPosition(){
        var a = mesh.triangles[trianglesIndexes.x];
        var b = mesh.triangles[trianglesIndexes.y];
        var c = mesh.triangles[trianglesIndexes.z];
        
        return baryCoords.x * a + baryCoords.y * b + baryCoords.z;
    }


```
Using these coordinates, we can calculate the position of the player on the triangle as it deforms. We can also calculate the player's normal vector based on the average normal of the triangle's vertices. This is important for determining the orientation of the player as it moves along the triangle(player.forward = -triangle.normal).

## Apply forces to the player ##
With the player position and normal mapped to the deforming triangle, we can apply forces to the player to simulate climbing. The forces applied will depend on the direction the player is moving, as well as the orientation of the triangle.

We can simulate climbing by applying normal forces to the player as it moves along the triangle. We can also use friction forces to simulate the resistance of the surface. Additionally, we can apply gravity forces to the player to simulate the effect of gravity on the climb.

## Adjust the camera ##
As the player moves along the deforming triangle, we need to adjust the camera to follow the action. We can achieve this by calculating the camera position and orientation based on the position and normal of the player on the triangle.

We can use a third-person camera system that follows the player and adjusts its position and orientation based on the position and orientation of the player.

## Conclusion ##
Implementing a climbing system like the one in SotC is no easy feat, but with a solid understanding of the problem and a clear approach, it is possible. By mapping the movement of the deforming mesh to the player and applying forces accordingly, we can simulate the experience of climbing a giant creature like a colossus.

In the next chapter, we will address some performance issues that may arise and some other problems that need to be solved to make the climbing system as smooth and realistic as possible.