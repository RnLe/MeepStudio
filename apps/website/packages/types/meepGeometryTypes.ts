// Immitation of the Meep Geometry Types

import { Vector3 } from "./meepBaseTypes";

interface MeepGeometricObject {
    // Derived from the class GeometricObject in Meep:
    // This class, and its descendants, are used to specify the solid geometric objects that form the dielectric structure being simulated.
    // In a 2d calculation, only the intersections of the objects with the xy plane are considered.

    // def __init__(self,
    //              material=Medium(),
    //              center=Vector3<0.0, 0.0, 0.0>,
    //              epsilon_func=None,
    //              label=None):

    // material [Medium class or function ] — The material that the object is made of (usually some sort of dielectric). Uses default Medium. If a function is supplied, it must take one argument and return a Python Medium.
    // epsilon_func [ function ] — A function that takes one argument (a Vector3) and returns the dielectric constant at that point. Can be used instead of material. Default is None.
    // center [Vector3] — Center point of the object. Defaults to (0,0,0).
    // One normally does not create objects of type GeometricObject directly, however; instead, you use one of the subclasses.

    material?: string; // Changed to string for code generation
    center: Vector3;
    epsilon_func?: string; // Function name if applicable
    label?: string; // Optional label for the object
}

export interface Sphere extends MeepGeometricObject {
    radius: number; // Radius of the sphere
}

export interface Cylinder extends MeepGeometricObject {
    radius: number; // Radius of the cylinder
    height?: number; // Height of the cylinder
    axis?: Vector3; // Axis vector for the cylinder, default is (0, 0, 1)
}

export interface Wedge extends Cylinder {
    // Represents a cylindrical wedge in Meep.
    radius: number; // Radius of the wedge
    height?: number; // Height is optional, inherited from Cylinder
    wedge_angle: number; // Angle of the wedge in radians
    wedge_start: Vector3; // Starting point of the wedge
}

export interface Cone extends Cylinder {
    radius: number; // Radius of the cone at the base
    height?: number; // Height is optional, inherited from Cylinder
    radius2: number; // Radius at the top (if applicable)
}

export interface Block extends MeepGeometricObject {
    // The lengths of the block edges along each of its three axes. Not really a 3-vector, but it has three components, each of which should be nonzero. No default value.
    size: Vector3; // Size of the block in x, y, z dimensions
    // The directions of the axes of the block; the lengths of these vectors are ignored. Must be linearly independent. They default to the three lattice directions.
    e1?: Vector3;
    e2?: Vector3;
    e3?: Vector3;
}

export interface Ellipsoid extends Block {
    // An ellipsoid. This is actually a subclass of Block, and inherits all the same properties, but defines an ellipsoid inscribed inside the block.
}

export interface Prism extends MeepGeometricObject {
    // The vertices that make up the prism. They must lie in a plane that's perpendicular to the axis. Note that infinite lengths are not supported. To simulate infinite geometry, just extend the edge of the prism beyond the cell.
    vertices: Vector3[];
    // The prism thickness, extruded in the direction of axis. mp.inf can be used for infinite height. No default value.
    height?: number; // Make height optional
    // The axis perpendicular to the prism. Defaults to Vector3(0,0,1).
    axis?: Vector3;
    // If center is not specified, then the coordinates of the vertices define the bottom of the prism with the top of the prism being at the same coordinates shifted by height*axis. If center is specified, then center is the coordinates of the centroid of all the vertices (top and bottom) of the resulting 3d prism so that the coordinates of the vertices are shifted accordingly.
    // The sidewall angle of the prism in units of radians. Default is 0.
    sidewall_angle?: number;
}