<style>
img{
    border-radius: 10%;
      display: block;
    margin-left: auto;
  margin-right: auto;
}

.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}
</style>

#### 1. Introduction
As a member of the BTFL project, I was tasked with the challenge of creating a climbing system similar to that of Shadow of the Colossus (SotC). It proved to be a complex problem. Since I could not find sufficient information online, my intent is offer an implementation which imitates the workings of SotC's climbing system in detail. 

Still, I warn you that it is highly unlikely that this approach was the one used on the original game(OG). This approach makes use of Raycasts and Unity's features which can be easily translated to other modern game engines, but probably the original approach consisted on this: <a href="">link al video</a>

<br>

##### 1.1 What is this all really about 
In SotC, the player navigates giant creatures known as colossi. Each colossus serves as an interactive puzzle, requiring different climbing techniques to get such puzzle solved. The animations of these colossi are complex and detailed, incorporating both FK and procedural movements while the main character(Wander) climbs around their organic bodies.

<img src="blog-posts/DeformingMeshes/ClimbingExamples.png" width="600" class="center">
<center>
    <b>This kind of thing has been around for quite a long time</b>
</center>

<br>

SotC is a technical masterpiece that is challenging to compare to other games even now, and this tutorial focuses on the technical aspect of the climbing mechanic, which differs from "conventional" climbing in most videogames.

##### 1.2 Defining the problem 
The issue at hand is maneuvering the player character through the deforming high-poly mesh that comprises the colossus's body. Climbing a static mesh is easy in comparison, as the wall's translation and rotation can be adpated through parenting the player to the wall. In contrast, the colossus mesh is a far more complicated, deforming entity affected by weighted sums of the nearby bones' transform, making climbing quite a problem. Trying to parent the player directly to the closest bone would result in clipping through the colossus' mesh.

<img src="blog-posts/DeformingMeshes/Climbing.gif" width="600">
<center>
<b>Thanks to Jaikhay for this gif from the early stages of the game</b>
<center>

<br>

###### 1.3 The basic solution ## 
<img src="blog-posts/DeformingMeshes/AttachedTriangle.png" width="600">
<center>
<b>Take the cube as your player, and the green model as your colossus</b>
</center>
<br>

The key relies in parenting the player to the closest triangle in the mesh. While parenting the player to a point would be pointless(pun intended) since points can't be rendered, triangles offer a visual representation which contains all the 3D information we need(position and orientation). This way, we allow the player to adapt to the changes in the mesh, leading to a local system based on the closest triangle to the player.

Such local system shall consist in a position defined by a coord system created after the deforming position of the triangle's vertices and an orietation system through the normals of the triangle.

#### 2. Triangles
Overall, the steps for our climbing mechanic are these: 

1. Identify the closest triangle
2. Make a coordinate system out of that triangle
3. Update the player's position and rotation according to the current status of that triangle
4. Apply the movement


##### 2.1 Identify the closest triangle #####
The first step to create our local system is to find the closest triangle to the player. That is, we have to find a way to get the closest triangle from the deforming mesh we wish to climb at hand.

There are several ways to find this triangle: raycasting for example. That would consist in casting a ray from the player's position and check for collisions, and try to get the closest one. For instance, we can just make a raycast from the player to the origin of the body we wish to climb, which might just fine.

But that approach might not always work. For that reason, we can use some code to find the closest point from a MeshCollider component, so we raycast in the direction of that point. I will not explain the workings of this code since that would take a long time and I don't consider myself the best person to do so.

###### Finding the closest point code
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

Once we have identified the closest point, use a raycast from the player to the point. In case you are wondering, this code is necessary since Unity does not implement a function to find the closest point from a MeshCollider. Given the case you try to use the function MeshCollider.GetClosestPoint(), which inherits from its base class Collider, you will get a warning log with bad news. This is the case for the 2022 version I used, so it might change in future versions.

##### 2.2 Update the collider #######
You can skip this step for now if you want to test the climbing over unanimated models. But, if you do use animations, you must make sure that the collision mesh gets updated to the changes caused by the animations. Otherwise, the collision won't match the current status of the model, since it will keep the initial shape of it.

Unity won't do that for you on its own. But don't worry, fixing this is really easy. For each of the deforming meshes in the scene, use this component.

###### Updating MeshColliders after animated MeshRenderers
```cs
    
    class MeshCollisionUpdater : MonoBehaviour{

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

This code can become expensive if used on complex meshes. For that reason, you may want to optimize it, updating only when needed. In fact, such consideration will be explored later.

##### 2.3 Map the movement of the triangle to the player #####
Now that we know which triangle the player is closest to, we need to map the movement of the triangle to the player. As the triangle deforms, we want the player to move along with it.

We can achieve this by calculating the barycentric coordinates of the player's position in relation to the triangle. Barycentric coordinates are a way of expressing a point as a weighted sum of the triangle's vertices. The limitation of this system is we can't use it to store points that do not belong to the planed defined by the triangle.

Under these circumstances, we have to find out the closest point in the triangle's plane that is closest to our player. If we are using raycasts for this climbing system, we can just use the hit point for that. On top of that, Unity's RaycastHit struct not only includes the hit point, but the barycentric coords too.

For this purpose, I suggest using a custom "MeshAttacher" class. This class will take a RaycastHit, and store the indexes of the colosion, as well as storing the weights.

```cs

public class MeshAttacher{

    Vector3 baryCoords;
    Vector3Int triangleIndexes;

    Transform attachedObject;
    Mesh mesh;

    public static Vector3 FindClosestPoint(MeshCollider collider)
    {
        ...Use the code above...
    }

    //Use this method with the hit of the Raycast.
    public void AttachToMesh(RaycastHit hit)
    {
        attachedObject = hit.transform;
        baryCoords = hit.barycentricCoordinate;
        
        var meshCollider = hit.transform.GetComponent<MeshCollider>();
        mesh = meshCollider.sharedMesh;
        
        //Consider reading Unity's docs regarding Mesh's properties. These triangles are indexes to vertices in sharedVertices. Quite confusing.
        var triangles = mesh.triangles;

        //hit.triangleIndex is the id of the colliding triangle in the triangles array. sharedMesh.triangles is an array containing the vertices of each of those 
        //triangles, which means that the [0] triangle will use vertices 1, 2, 3; [1] triangle uses 4,5,6; [2], 7,8,9 ... Confusing.
        int tIndex = hit.triangleIndex * 3;

        triangleVertices.x = triangles[tIndex];
        triangleVertices.y = triangles[tIndex + 1];
        triangleVertices.z = triangles[tIndex + 2];
    }

    public Vector3 GetUpdatedClimbPosition()
    {
        var a = mesh.triangles[trianglesIndexes.x];
        var b = mesh.triangles[trianglesIndexes.y];
        var c = mesh.triangles[trianglesIndexes.z];
        
        //The mesh's vertices are stored in local space, so you have to turn them into world space
        return attachedObject.TransformPoint(baryCoords.x * a + baryCoords.y * b + baryCoords.z);
    }

    public Vector3 GetUpdatedClimbNormal()
    {
        var normals = mesh.normals;

        Vector3 normal = normals[triangleVertices[0]] * baryCoords.x;
        normal += normals[triangleVertices[1]] * baryCoords.y;
        normal += normals[triangleVertices[2]] * baryCoords.z;

        //The mesh's normals are stored in local space, so you have to turn them into world space
        return attachedObject.TransformDirection(normal);
    }

```

Using these coordinates, we can calculate the position of the player on the triangle as it deforms. We can also calculate the player's normal vector based on the average normal of the triangle's vertices. This is important for determining the orientation of the player as it moves along the triangle(player.forward = -triangle.normal). Consider "transform.position = GetUpdatedClimbPosition() + GetUpdatedClimbNormal() * distanceToWall";

There are still some problems still, like tracking the up vector of the player as the triangle deforms. You can use another MeshAttacher for that, getting a higher point in the mesh that represents the up of the player, so you can define a vector from one MeshAttacher to the other.

##### 2.4 Apply forces to the player #####
With the player position and normal mapped to the deforming triangle, we can apply forces to the player to simulate climbing. The forces applied will depend on the direction the player is moving, as well as the orientation of the triangle.

Now, moving the player along the surface will just mean getting a new point from the mesh on this fashion. For example, in the player's current right and up way. Once hit, move the player to the next point and update the MeshAttacher in the proccess.

##### Conclusion #####
Even after all of that, there are some considerations left if we desire to recreate SotC. The first and most important is the usage of ledges, which is something I will cover on the second part. 

And the other one, is moving the player in conjunction to some rootmotion movement, since Wander really moved through rootmotion. This is my guess since ripped animation applies some real root motion movement to the player. But rootmotion is a complex matter and I doubt it is needed for reaching the same feeling in a climbing mechanic.