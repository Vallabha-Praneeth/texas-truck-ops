'use client';

import React from 'react';
import Lottie from 'lottie-react';

// Simplified test - just one animation
const testAnimation = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "Test",
    ddd: 0,
    assets: [],
    layers: [
        {
            ddd: 0,
            ind: 1,
            ty: 4,
            nm: "Circle",
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },
                r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 60, s: [360] }] },
                p: { a: 0, k: [50, 50, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            shapes: [
                {
                    ty: "el",
                    s: { a: 0, k: [30, 30] },
                    p: { a: 0, k: [0, 0] }
                },
                {
                    ty: "st",
                    c: { a: 0, k: [0, 1, 1, 1] },
                    o: { a: 0, k: 100 },
                    w: { a: 0, k: 3 }
                }
            ],
            ip: 0,
            op: 60,
            st: 0
        }
    ]
};

export const LottieTest = () => {
    return (
        <div className="p-8 bg-background">
            <h2 className="text-foreground mb-4">Lottie Test (should spin)</h2>
            <div className="w-24 h-24 bg-secondary rounded">
                <Lottie
                    animationData={testAnimation}
                    loop={true}
                    autoplay={true}
                />
            </div>
        </div>
    );
};
