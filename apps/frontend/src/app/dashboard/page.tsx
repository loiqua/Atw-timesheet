"use client";
import * as React from "react";
import { TaskList } from "@/components/tasks/TaskList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";

const DashboardPage = () => {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="mt-6 h-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TimeSheet</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
            <Button className="bg-yellow-400 text-blue-900 hover:bg-yellow-500 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Créer un projet
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Label htmlFor="filter-date" className="sr-only">
                Date
              </Label>
              <Input
                id="filter-date"
                name="date"
                type="date"
                placeholder="jj/mm/aaaa"
                inputMode="numeric"
                className="pr-10"
              />
              <CalendarIcon
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="filter-query" className="sr-only">
                Rechercher
              </Label>
              <Input
                id="filter-query"
                name="q"
                type="search"
                placeholder="Rechercher par titre…"
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskList />
    </div>
  );
};

export default DashboardPage;
