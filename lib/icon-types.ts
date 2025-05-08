export type IconProps = React.ComponentPropsWithoutRef<"svg"> & {
  /**
   * The title provides an accessible short text description to the SVG
   */
  title?: string;
  /**
   * Hex color or color name or "default" to use the default hex for each icon
   */
  color?: string;
  /**
   * The size of the Icon.
   */
  size?: string | number;
  /**
   * Stroke width of the Icon.
   */
  strokeWidth?: string | number;
};

export declare type IconType = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;
