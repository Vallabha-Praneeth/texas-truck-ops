'use client';

import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Truck, Layers, Building2, Calendar, Plus, Bell } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="px-6 py-4 bg-background/95 backdrop-blur-lg sticky top-0 z-40 border-b border-border">
                <div className="container mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Welcome back</p>
                        <h1 className="text-xl font-bold text-foreground">LED Billboard Admin</h1>
                    </div>
                    <button className="relative p-2">
                        <Bell className="w-6 h-6 text-foreground" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    </button>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        icon={Layers}
                        label="Total Requests"
                        value={12}
                        trend={{ value: 16, isPositive: true }}
                    />
                    <KPICard
                        icon={Calendar}
                        label="Active Bookings"
                        value={8}
                        trend={{ value: 12, isPositive: true }}
                    />
                    <KPICard
                        icon={Truck}
                        label="Available Trucks"
                        value={24}
                    />
                    <KPICard
                        icon={Building2}
                        label="Organizations"
                        value={6}
                    />
                </div>

                {/* Quick Actions */}
                <div className="card-gradient p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        <Button className="bg-primary text-primary-foreground hover:opacity-90 glow-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Request
                        </Button>
                        <Button variant="outline" className="border-border text-foreground">
                            Add Truck
                        </Button>
                        <Button variant="outline" className="border-border text-foreground">
                            New Organization
                        </Button>
                        <Button variant="secondary">
                            View Reports
                        </Button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card-gradient p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                        <button className="text-sm text-primary font-medium hover:underline">
                            View all
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                            <div className="flex-1">
                                <p className="font-medium text-foreground">New request from ABC Corp</p>
                                <p className="text-sm text-muted-foreground">DFW region • 2 hours ago</p>
                            </div>
                            <StatusBadge status="offered" animated />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                            <div className="flex-1">
                                <p className="font-medium text-foreground">Booking confirmed for Houston</p>
                                <p className="text-sm text-muted-foreground">LED-TX-002 • 5 hours ago</p>
                            </div>
                            <StatusBadge status="booked" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                            <div className="flex-1">
                                <p className="font-medium text-foreground">New truck added by XYZ Operators</p>
                                <p className="text-sm text-muted-foreground">Austin region • 1 day ago</p>
                            </div>
                            <StatusBadge status="available" animated />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                            <div className="flex-1">
                                <p className="font-medium text-foreground">Campaign completed successfully</p>
                                <p className="text-sm text-muted-foreground">San Antonio • 2 days ago</p>
                            </div>
                            <StatusBadge status="completed" animated />
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card-gradient p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Requests by Region</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">DFW</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-region-dfw" style={{ width: '75%' }} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">9</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Houston</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-region-houston" style={{ width: '50%' }} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">6</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Austin</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-region-austin" style={{ width: '42%' }} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">5</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">San Antonio</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-region-sanantonio" style={{ width: '25%' }} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">3</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-gradient p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Status Distribution</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <StatusBadge status="available" />
                                <span className="text-sm font-medium text-foreground">8 slots</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <StatusBadge status="offered" />
                                <span className="text-sm font-medium text-foreground">4 offers</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <StatusBadge status="booked" />
                                <span className="text-sm font-medium text-foreground">8 bookings</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <StatusBadge status="running" />
                                <span className="text-sm font-medium text-foreground">3 active</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <StatusBadge status="completed" />
                                <span className="text-sm font-medium text-foreground">12 completed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
