declare module "react-simple-maps" {
  import type { FC, ReactNode, SVGProps } from "react";
  import type { GeoProjection } from "d3-geo";
  import type { FeatureCollection, Geometry } from "geojson";

  export interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: GeoProjection | string;
    width?: number;
    height?: number;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    filterZoomEvent?: (element: Element) => boolean;
    onMove?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | FeatureCollection;
    children: (args: {
      geographies: Array<{
        rsmKey: string;
        properties: Record<string, unknown>;
        geometry: Geometry;
      }>;
    }) => ReactNode;
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: { rsmKey: string; properties: Record<string, unknown>; geometry: Geometry };
    style?: {
      default?: SVGProps<SVGPathElement>;
      hover?: SVGProps<SVGPathElement>;
      pressed?: SVGProps<SVGPathElement>;
    };
  }

  export interface MarkerProps extends SVGProps<SVGGElement> {
    coordinates: [number, number];
    children?: ReactNode;
  }

  export const ComposableMap: FC<ComposableMapProps>;
  export const ZoomableGroup: FC<ZoomableGroupProps>;
  export const Geographies: FC<GeographiesProps>;
  export const Geography: FC<GeographyProps>;
  export const Marker: FC<MarkerProps>;
}
