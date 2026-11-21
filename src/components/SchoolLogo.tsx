import Image from "next/image";

type SchoolLogoProps = {
  size?: number;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export default function SchoolLogo({
  size = 40,
  priority = false,
  className,
  imageClassName,
}: SchoolLogoProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#C8A878] bg-[#4A2C20] p-1 ${
        className || ""
      }`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/school-logo.png"
        alt="Rising Foundation Academy logo"
        width={size}
        height={size}
        priority={priority}
        className={`h-full w-full object-contain ${imageClassName || ""}`}
      />
    </span>
  );
}