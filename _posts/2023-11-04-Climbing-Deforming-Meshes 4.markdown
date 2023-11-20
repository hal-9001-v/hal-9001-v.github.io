---
layout: post
title: WIP-Climbing Deforming Meshes - Part Four, Ledges
date: 2023-03-10 00:00:21 +0300
description: Putting limits to the climb
img: DeformingMeshes4/coverWip.png
fig-caption: 
tags: [Unity, Learning, Climbing]
category: Unity
---

In all honesty, this is probably one of the most headaching parts of the whole system. As I said in the previous chapter, Praey for the Gods omitted this feature, and the game still works. I wonder if other people gave importance to the fact that there were no ledges haha.

Anyways, ledges can be done pretty simple on non deforming ledges. Many times, these ledges are just straight lines where the player can move horizontally, and that is enough. To add more complexity, it can be not only a straight line, but can be curved. And if you want to make it even more complicated, you can attach it to a deforming mesh so it updates with the animations and still work with the gameplay.

This last thing involves not only the gameplay issues, but the logic to track certain vertices of the model and, at least in my case, creating a tool for setting things up through LineRenderers in Unity in the editor.

So, if by chance, you are thinking about making a SotC climbing system, skipping ledges in deforming meshes could be a good option. It is up to you.

# Simple Ledges #

For visual convenience, we can use LineRenderers and use them as Splines. If you are working in Unity 2022 or later, you can use the Spline package directly, and that might be the best option. This functionality was developped for the BTFL project, which uses a 2021 version.

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

 As a side note, if you are going to code it yourself, I do not recoment using Bezier curves, Catmull-Rom... Because, the difference wont be much and things will get more and more complex. That is, keep your life simple with linear curves. After all, ledges depend on the model they are attached to, so they will have as much smoothness as the models require.

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

# Ledges in non-deforming meshes #

# Ledges in deforming meshes #