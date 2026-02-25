import NavigationRail from "@/components/NavigationRail";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <NavigationRail />
            <div className="flex-1 pl-20 transition-all duration-300">
                {children}
            </div>
        </div>
    );
}
