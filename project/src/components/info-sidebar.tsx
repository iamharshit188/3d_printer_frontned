"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Info, Users } from "lucide-react";

export function InfoSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
          aria-label="Show project information"
        >
          <Info className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="glassy">
        <SheetHeader className="mt-8">
          <SheetTitle className="text-2xl font-bold">PsiFur Blok</SheetTitle>
          <SheetDescription>
            A modern 3D printing simulation application.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-8">
          <div className="space-y-2">
            <h3 className="font-semibold">About the Project</h3>
            <p className="text-sm text-muted-foreground">
              This application provides a simple, clean interface to visualize the 3D printing process. Users can draw freehand shapes or select from a list of predefined objects to see a simulated layer-by-layer print preview.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team Members
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Kirti Singh</li>
              <li>Khushi Tiwari</li>
              <li>Ashraful Alam</li>
              <li>Harshit Tiwari</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
