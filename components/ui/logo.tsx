import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="Sheriff Security"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export function LogoIcon({ size = 32, className }: LogoProps) {
  return (
    <Image
      src="/logo-icon.svg"
      alt="Sheriff Security"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
