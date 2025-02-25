
#### Introduction ####
In this chapter, we will explore some simple ideas to improve the performance of your climbing system, and adding some ledges, which is something that might not be necessary for your projects. In fact, if I recall correctly, Praey for the Gods does not make use of them. I wonder if other people gave importance to that haha.

Keep in mind that this chapter should be considered "optional". Its relevance depends on the project's complexity and performance requirements when it comes to the optimization part since Modern CPUs are quite forgiving in most cases, so the decision to implement these measures is ultimately up to you. And as I pointed out, ledges might not be worth the trouble.

#### 1. Optimization
##### 1.1 Simplifying Complex Meshes #####
One of the most straightforward (and vital) steps for optimizing your project is creating a simplified collision mesh for updates. If your model is highly detailed and you don't want your character to resemble a 3D PS1 character, there's no need to fret. Games like SotC used a highly simplified collision mesh beneath their high-poly models. The key is to render the high-poly model while using a simple yet functional model for collisions. 


<div class="text-center">
    <img src="blog-posts/DeformingMeshes2/PolyComparison.png" width="500"/>
</div>

Players are unlikely to notice the difference even if comparing these two models ripped from the original game makes you think otherwise. For example, notice that the collision model doesn't feature "fingers". It just uses a very thick hand (like a snow glove), with no fingers since the gameplay doesn't really interact with them.

Later in this post, you'll find additional reasons to use simple meshes. In short, simple meshes are much easier to manipulate for optimization, ledge creation, and puzzle design compared to high-poly meshes.

##### 1.2 Culling Unnecessary Calculations #####
The climbing system can be resource-intensive due to the need for frequent collider updates as the meshes deform. The computational demand is directly related to the complexity of the collision mesh. To reduce this load, consider updating only the colliders within a specific range of the player's interactions.

Rather than calculating the distance between the player and each individual triangle of every climbable MeshCollider, it's more efficient to assess the distance to the collider's center.

To implement this, I suggest using a "MeshColliderUpdaterTrigger" component. This component will update all the "MeshCollidersUpdate" components within a certain range. 

##### 1.3 Segmenting the Collision Mesh #####
Similar to simplifying colliders, you can divide the colossus's body into multiple segments, each with its own MeshColliderUpdate component. This segmentation reduces the number of updates required for the entire body, especially if you implement some form of culling.

This approach might seem like overkill in some situations, but I can't help but think it’s something the developers of SotC might have considered, especially given the game's performance issues. I’m not sure if they actually used this method, but it makes sense to me that it would have crossed their minds as a potential optimization trick.

<div class="text-center">
    <img src="blog-posts/DeformingMeshes2/Side to side.png" width="500"/>
</div> 
In the previous picture, we can see a smooth and high detailed mesh, full collision mesh, and segmented mesh.


##### 1.4 Using Multiple Update Profiles #####
Not all climbable bodies need the same update frequency. It might be helpful to create different update profiles or adjust the update rate manually based on your needs. For instance, meshes that are constantly deforming and interact with the player should be set to a high-quality profile. On the other hand, for less critical scenarios—like an arrow stuck in a distant mesh—a lower update profile would suffice.

The next code is an extension of the previous' chapter MeshColliderUpdater. It simply adds a condition for the update.

###### Adding quality profiles to MeshUpdaters
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

#### 2. Ledges ####
Honestly, this part of the system can be one of the most frustrating to manage. As mentioned in the previous chapter, Praey for the Gods chose to omit this feature, and the game still works.

Anyway, ledges are relatively straightforward to implement in non-deforming scenarios. Often, they are simply straight lines where the player can move horizontally, which is usually sufficient. To add complexity, ledges can be curved rather than straight. For an even more advanced approach, you can attach the ledge to a deforming mesh, allowing it to update with animations while still functioning within the gameplay. This is the case of SotC!

Implementing defornming ledges involves not just gameplay considerations but also the logic for tracking specific vertices of the model. In my case, it required creating a tool to set things up using LineRenderers in Unity's editor.

So, if you’re considering implementing a SotC-style climbing system, you might want to think about skipping ledges on deforming meshes. The choice is yours.

#### 2.1 Simple Ledges ####
For visual convenience, we can use LineRenderers and use them as Splines. If you are working in Unity 2022 or later, you can use the Spline package directly, and that might be the best option. This functionality was developped for the BTFL project, which uses a 2021 version, so that was not an option.

The first step, let's define a Ledge component.


```cs
    public abstract class Ledge : MonoBehaviour
{
    public abstract float GetClosestT(Vector3 worldPosition);

    public abstract Vector3 GetPoint(float t);

    public abstract Vector3 GetPointWithOffset(float t, float offset);

    public abstract float GetTWithOffset(float t, float offset);

    public abstract Vector3 GetClosestPoint(Vector3 position);

    public abstract Vector3 GetLedgeUp(float t);

    public abstract Vector3 GetLedgeOut(float t);

    public abstract Vector3 GetLedgeCenter();

    public abstract Vector3 GetLedgeTangent(float t);

    public static Ledge GetClosestLedge(Vector3 position, out Vector3 closestPoint)
    {
        closestPoint = Vector3.zero;

        Ledge closestLedge = null;
        float closestDistance = float.MaxValue;
        foreach (Ledge ledge in FindObjectsOfType<Ledge>())
        {
            var point = ledge.GetClosestPoint(position);
            float distance = Vector3.SqrMagnitude(position - point);
            if (distance < closestDistance)
            {
                closestDistance = distance;
                closestLedge = ledge;
                closestPoint = point;
            }
        }
        return closestLedge;
    }
}

```

Now, you might be wondering why there is no code here. The reason is that it really takes a lot of code to make all of this work, and I am sure that the Spline package will help you handsomely with this matter.

As a side note, if you’re coding this yourself, I wouldn’t recommend using Bezier curves or Catmull-Rom splines. The difference in results isn’t significant, and they can add unnecessary complexity. Stick with linear curves to keep things simple. 

*More importantly*, remember that ledges are tied to the model they’re attached to, so their smoothness will be exactly that of the model. That way you will avoid visual problems regarding the climbable mesh and the player's position.

So, the first step is finding the closest point on the curve.

```cs
    bool CheckLedges(out Ledge attachedLedge, float range)
    {
        foreach (var ledge in GameObject.FindObjectsOfType<Ledge>())
        {
            var closestPoint = ledge.GetClosestPoint(transform.position);

            //Ledges work better when the player is under them
            if (closestPoint.y < transform.position.y)
            {
                continue;
            }

            if (Vector3.Distance(closestPoint, transform.position) < range)
            {
                attachedLedge = ledge;
                return true;
            }
        }

        attachedLedge = null;
        return false;
    }
```

Once you know the closest edge, you attach the player's position to a t position from the curve. Now, everytime the player moves, you have to increase the current t in the curve, so the position gets updated. 

```cs
    float ledgeT;
    void MoveInLedge(Vector2 axis,float speed)
    {
            float sign;
            if (axis.x > 0)
            {
                sign = Mathf.Sign(ledgeStartT - currentLedge.GetClosestT(Transform.position - body.transform.right));
            }
            else
            {
                sign = Mathf.Sign(ledgeStartT - currentLedge.GetClosestT(Transform.position + body.transform.right));
            }
            ledgeDistance = sign * distance;

            ledgeT = currentLedge.GetTWithOffset(ledgeStartT, ledgeDistance * speed * Time.deltaTime);
            
            transform.position = currentLedge.GetPosition(ledgeT);
    }
```

To be continued......

##### 2.2 Ledges in non-deforming meshes 

##### 2.3 Ledges in deforming meshes #####