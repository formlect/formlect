"use client";

import { EllipsisIcon, FileTextIcon, HouseIcon, InboxIcon, LayoutTemplateIcon, LogOutIcon, PlugIcon, SearchIcon, SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/auth/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useFormsStore } from "@/stores/forms-store";

// Only Home and All forms have a screen today; the rest render disabled until their routes exist.
const NAV = [
  { label: "Home", icon: HouseIcon, href: "/dashboard" },
  { label: "All forms", icon: FileTextIcon, href: "/dashboard#forms", count: true },
  { label: "Responses", icon: InboxIcon },
  { label: "Templates", icon: LayoutTemplateIcon },
  { label: "Integrations", icon: PlugIcon },
  { label: "Members", icon: UsersIcon },
];

// v1 sidebar: row hover is the border tone, the active row is the white surface.
const ITEM = "h-[34px] gap-2.5 rounded-lg px-2.5 text-[13.5px] font-semibold text-sidebar-foreground hover:bg-border data-active:bg-sidebar-accent data-active:font-extrabold data-active:text-sidebar-accent-foreground";

export function AppSidebar({ user }: { user: { name: string; email: string; image?: string | null } }) {
  const pathname = usePathname();
  const router = useRouter();
  const forms = useFormsStore((s) => s.forms);
  const setPaletteOpen = useDashboardStore((s) => s.setPaletteOpen);

  return (
    <Sidebar>
      <SidebarHeader className="gap-1 px-3 pt-3.5">
        <Link href="/dashboard" className="rounded-[10px] p-2 hover:bg-border">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mt-2 mb-1.5 flex h-9 items-center gap-2 rounded-[9px] border border-input bg-background px-2.5 text-[13px] text-ink-3 transition-colors hover:border-control"
        >
          <SearchIcon className="size-4" />
          <span className="flex-1 text-left">Search or jump to…</span>
          <Kbd>⌘K</Kbd>
        </button>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-1">
            {NAV.map(({ label, icon: Icon, href, count }) => (
              <SidebarMenuItem key={label}>
                {href ? (
                  <SidebarMenuButton className={ITEM} isActive={label === "Home" && pathname === "/dashboard"} render={<Link href={href} />}>
                    <Icon className="size-4" />
                    <span className="flex-1">{label}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton className={ITEM} disabled title="Coming soon">
                    <Icon className="size-4" />
                    <span className="flex-1">{label}</span>
                  </SidebarMenuButton>
                )}
                {count && <SidebarMenuBadge className="text-[11.5px] font-medium text-ink-3">{forms.length}</SidebarMenuBadge>}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-1 px-3 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className={ITEM} disabled title="Coming soon">
              <SettingsIcon className="size-4" />
              <span className="flex-1">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" className="mt-1 flex items-center gap-2.5 border-t border-sidebar-border px-2.5 pt-3 pb-1 text-left outline-none" />}
          >
            <Avatar size="sm" className="size-7">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback>{(user.name || user.email).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-bold text-foreground">{user.name}</span>
              <span className="truncate text-[11.5px] text-muted-foreground">{user.email}</span>
            </span>
            <EllipsisIcon className="size-4 text-ink-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-52">
            <DropdownMenuItem onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.replace("/sign-in") } })}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
