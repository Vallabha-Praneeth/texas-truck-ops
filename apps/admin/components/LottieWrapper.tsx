'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import Lottie with SSR disabled
// This prevents "window is not defined" errors during Next.js SSR
const Lottie = dynamic(() => import('lottie-react'), {
    ssr: false,
    loading: () => <div className="w-full h-full" />,
});

// Type-safe wrapper that forwards all props to Lottie
type LottieProps = ComponentProps<typeof Lottie>;

export const LottieWrapper = (props: LottieProps) => {
    return <Lottie {...props} />;
};
