"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DrawingCanvas } from './drawing-canvas';
import { PrintPreview } from './print-preview';
import { InfoSidebar } from './info-sidebar';
import { PREDEFINED_SHAPES, PREDEFINED_WORDS } from '@/lib/shapes';
import { Box, Pencil, Shapes, Type, Printer, Plug, CheckCircle2, XCircle, Globe, Pyramid, Circle, Move3d } from 'lucide-react';

export type ShapeData = {
  type: 'shape' | 'word' | 'drawing';
  id: string;
  points?: { x: number; y: number }[];
};

const shapeIcons: { [key: string]: React.ElementType } = {
  cube: Box,
  sphere: Globe,
  pyramid: Pyramid,
  torus: Circle,
};

const printSteps = [
  "Heating nozzle to 210°C...",
  "Calibrating X/Y/Z axes...",
  "Preparing print bed...",
  "Starting print job...",
  "Printing layer",
  "Extruding filament...",
  "Moving along X axis...",
  "Moving along Y axis...",
  "Layer completed.",
];

export function SliceViewLayout() {
  const [shapeData, setShapeData] = useState<ShapeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [tab, setTab] = useState('shapes');
  const [nozzlePosition, setNozzlePosition] = useState({ x: 150, y: 100, z: 0 });

  const handleShapeSelect = (type: 'shape' | 'word', id: string) => {
    if (isPrinting) return;
    setShapeData({ type, id });
  };

  const handleDrawEnd = (points: { x: number; y: number }[]) => {
    if (isPrinting) return;
    setShapeData({ type: 'drawing', id: 'custom-drawing', points });
  };
  
  const handleClearDrawing = () => {
    if (tab === 'draw' && shapeData?.type === 'drawing') {
      setShapeData(null);
    }
  };

  const startPrint = () => {
    if (!shapeData || !isConnected || isPrinting) return;
    setIsPrinting(true);
    setProgress(0);
    setLog(["Print process initiated."]);
    setNozzlePosition({ x: 150, y: 100, z: 0 }); // Start at center of canvas
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrinting && progress < 100) {
        const totalDuration = 20000; // 20 seconds total print time
        const steps = 200; // Increased steps for smoother nozzle movement
        const intervalTime = totalDuration / steps;

        interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / steps);

                if (shapeData?.type === 'drawing' && shapeData.points && shapeData.points.length > 0) {
                    const pointIndex = Math.floor((newProgress / 100) * (shapeData.points.length - 1));
                    const nextPoint = shapeData.points[pointIndex];
                    if (nextPoint) {
                        setNozzlePosition({
                            x: nextPoint.x,
                            y: nextPoint.y,
                            z: parseFloat(((newProgress / 100) * 10).toFixed(2)),
                        });
                    }
                } else {
                    const angle = (newProgress / 100) * Math.PI * 8; 
                    const radius = 60 * Math.sin((newProgress / 100) * Math.PI);
                    
                    let x = 150 + radius * Math.cos(angle);
                    let y = 100 + radius * Math.sin(angle);
                    
                    setNozzlePosition({
                        x: parseFloat(x.toFixed(2)),
                        y: parseFloat(y.toFixed(2)),
                        z: parseFloat(((newProgress / 100) * 10).toFixed(2)),
                    });
                }


                if (newProgress >= 100) {
                    clearInterval(interval);
                    setIsPrinting(false);
                    setLog(prevLog => [...prevLog, "Print completed successfully."]);
                    return 100;
                }
                
                if (Math.floor(newProgress) % 10 === 0 && Math.floor(prev) % 10 !== 0) {
                    const stepIndex = Math.floor(Math.random() * printSteps.length);
                    const layer = Math.floor(newProgress / 10) + 1;
                    let message = printSteps[stepIndex];
                    if (message.includes("layer")) {
                        message = `${message} ${layer}...`;
                    }
                    setLog(prevLog => [...prevLog, message].slice(-20));
                }
                return newProgress;
            });
        }, intervalTime);
    }
    return () => clearInterval(interval);
}, [isPrinting, progress, shapeData]);


  const ShapeSelector = ({ type, items }: { type: 'shape' | 'word', items: {id: string, name: string}[]}) => (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => {
        const Icon = shapeIcons[item.id];
        return (
          <Button
            key={item.id}
            variant={shapeData?.id === item.id ? "secondary" : "outline"}
            onClick={() => handleShapeSelect(type, item.id)}
            disabled={isPrinting}
            className="flex h-12 flex-col items-start justify-center p-2"
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              <span className="text-sm font-medium">{item.name}</span>
            </div>
          </Button>
        )
      })}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
      <main className="container mx-auto p-4 md:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight font-headline">PsiFur Blok</h1>
          <p className="text-muted-foreground mt-2">A simple 3D printing simulation app</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel */}
          <Card className="lg:col-span-2 h-fit glassy">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Configure your 3D print job.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="shapes"><Shapes className="mr-2" />Shapes</TabsTrigger>
                  <TabsTrigger value="words"><Type className="mr-2" />Words</TabsTrigger>
                  <TabsTrigger value="draw"><Pencil className="mr-2" />Draw</TabsTrigger>
                </TabsList>
                <TabsContent value="shapes" className="pt-4">
                  <ShapeSelector type="shape" items={PREDEFINED_SHAPES} />
                </TabsContent>
                 <TabsContent value="words" className="pt-4">
                  <ShapeSelector type="word" items={PREDEFINED_WORDS} />
                </TabsContent>
                <TabsContent value="draw" className="pt-4">
                  <DrawingCanvas onDrawEnd={handleDrawEnd} onClear={handleClearDrawing} width={300} height={200} />
                </TabsContent>
              </Tabs>
              
              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="connection-switch" className="flex items-center gap-2 text-base font-medium">
                    <Printer />
                    Printer Connection
                  </Label>
                   <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                          {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                      <Switch
                          id="connection-switch"
                          checked={isConnected}
                          onCheckedChange={setIsConnected}
                          disabled={isPrinting}
                          aria-label="Toggle printer connection"
                      />
                  </div>
                </div>
                <Button
                  onClick={startPrint}
                  disabled={!shapeData || !isConnected || isPrinting}
                  className="w-full text-lg py-6"
                >
                  <Printer className="mr-2" />
                  {isPrinting ? "Printing..." : "Start Print"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Print Status</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Move3d className="h-4 w-4" />
                    <span className="font-mono text-xs">
                      X:{nozzlePosition.x.toFixed(1)} Y:{nozzlePosition.y.toFixed(1)} Z:{nozzlePosition.z.toFixed(1)}
                    </span>
                  </div>
                </div>
                <Progress value={progress} className="w-full" />
                <ScrollArea className="h-40 w-full rounded-md border p-3">
                  <div className="flex flex-col gap-2 text-sm">
                    {log.length === 0 && <p className="text-muted-foreground">Print log will appear here...</p>}
                    {log.map((entry, i) => (
                      <p key={i} className="font-mono text-xs">
                        <span className="text-muted-foreground mr-2">{`[${new Date().toLocaleTimeString()}]`}</span>
                        {entry}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </div>

            </CardContent>
          </Card>

          {/* Right Panel */}
          <Card className="lg:col-span-3 glassy">
             <CardHeader className="relative">
                <CardTitle>Print Preview</CardTitle>
                <CardDescription>A 3D visualization of your object.</CardDescription>
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {shapeData ? (
                    <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Object Loaded
                    </span>
                  ) : (
                     <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <XCircle className="h-4 w-4" /> No Object
                    </span>
                  )}
                </div>
            </CardHeader>
            <CardContent className="h-[400px] md:h-[600px] lg:h-auto lg:aspect-[4/3] p-0">
              <PrintPreview shapeData={shapeData} progress={progress} isPrinting={isPrinting} nozzlePosition={nozzlePosition} />
            </CardContent>
          </Card>
        </div>
      </main>
      <InfoSidebar />
    </div>
  );
}
