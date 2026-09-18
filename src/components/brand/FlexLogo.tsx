import Image from "next/image";
import FlexLogoImage from "../../../assets/logos/flex-logo.png";

type FlexLogoProps = {
  className?: string;
  priority?: boolean;
};

/** Flex Money Transfer wordmark — height-based sizing keeps the wide logo proportional. */
export function FlexLogo({ className, priority = false }: FlexLogoProps) {
  return (
    <Image
      src={FlexLogoImage}
      alt="Flex Money Transfer"
      priority={priority}
      className={["h-9 w-auto max-w-[10.5rem] object-contain", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
