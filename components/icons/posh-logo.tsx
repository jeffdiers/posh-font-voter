import * as React from "react";

import type { IconProps } from "@/lib/icon-types";

export const PoshLogo = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => {
    const {
      size = 25,
      color = "currentColor",
      strokeWidth = 0,
      title = "Posh Logo",
    } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={typeof size === "number" ? (size * 16) / 25 : size}
        viewBox="0 0 25 16"
        fill="none"
        role="img"
        ref={ref}
        {...props}
      >
        <title>{title}</title>
        <g clipPath="url(#clip0_8204_462)">
          <path
            d="M23.4359 7.90373C23.0523 10.1174 22.0422 12.2678 20.4274 14.3149H22.1495C25.2327 9.9475 25.8184 5.14835 23.8918 0H22.4062C23.5206 2.75821 23.8674 5.41403 23.4364 7.90373H23.4359Z"
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <path
            d="M1.5646 6.41114C1.94773 4.19702 2.95775 2.04707 4.57311 0H2.85095C-0.231783 4.36737 -0.817967 9.16652 1.10916 14.3149H2.59474C1.48032 11.5567 1.13359 8.90084 1.5646 6.41114Z"
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <path
            d="M14.8304 2.8927H7.17692L5.07068 16H9.30615L9.9158 12.2135H13.5368C17.6382 12.2135 19.9293 10.3019 19.9293 6.89766C19.9293 4.31263 18.1004 2.8927 14.8304 2.8927ZM12.6417 9.23778H10.3775L10.9263 5.86846H13.1216C14.2787 5.86846 14.9419 6.38943 14.9419 7.2983C14.9419 8.53088 14.1034 9.23778 12.6413 9.23778H12.6417Z"
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </g>
        <defs>
          <clipPath id="clip0_8204_462">
            <rect width="25" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }
);
PoshLogo.displayName = "PoshLogo";
