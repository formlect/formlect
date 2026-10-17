import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Formlect Components > Actions. Flat fills; default and destructive get the 2px inset "pressed edge".
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-bold whitespace-nowrap transition-[background-color,transform,box-shadow] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] hover:bg-primary-hover active:translate-y-px active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:scale-[0.98]",
        outline:
          "border-input bg-card text-foreground shadow-[0_1px_2px_rgb(27_23_36/0.05)] hover:bg-background active:scale-[0.98] aria-expanded:bg-background",
        ghost:
          "text-foreground hover:bg-secondary active:scale-[0.98] aria-expanded:bg-secondary",
        soft: "bg-accent text-accent-foreground hover:bg-accent-hover active:scale-[0.98]",
        destructive:
          "bg-destructive text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] hover:bg-destructive-hover active:translate-y-px active:shadow-none",
        link: "h-auto px-1 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md px-3 text-[13px]",
        lg: "h-12 rounded-[12px] px-[22px] text-[15px]",
        icon: "size-10",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
