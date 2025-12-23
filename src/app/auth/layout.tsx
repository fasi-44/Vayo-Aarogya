import { HeartPulse, Activity, Users, ClipboardCheck, FileText, Shield, Zap, Leaf, Heart, Star } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const features = [
        { icon: Activity, text: "WHO ICOPE Assessments" },
        { icon: Users, text: "Multi-Role Care Teams" },
        { icon: ClipboardCheck, text: "Health Monitoring" },
        { icon: FileText, text: "Care Plan Generation" },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-nature relative overflow-hidden">
                {/* Animated background decorations */}
                <div className="absolute inset-0">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 via-primary-500/85 to-sage-600/90" />

                    {/* Animated blobs */}
                    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-slow" />
                    <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary-400/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-float-slower" />

                    {/* Floating circles */}
                    <div className="absolute top-20 right-20 w-4 h-4 bg-white/30 rounded-full animate-float" />
                    <div className="absolute top-40 left-40 w-6 h-6 bg-secondary-300/40 rounded-full animate-float-slow" />
                    <div className="absolute bottom-40 right-40 w-3 h-3 bg-accent-300/30 rounded-full animate-float-slower" />
                    <div className="absolute bottom-20 left-20 w-5 h-5 bg-white/20 rounded-full animate-float" />

                    {/* Wave pattern at bottom */}
                    <svg className="absolute bottom-0 left-0 right-0 h-32 opacity-10" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    {/* Top - Logo */}
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                                <HeartPulse className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-2xl">Vayo Aarogya</h2>
                                <p className="text-white/60 text-sm">Healthy Ageing Platform</p>
                            </div>
                        </div>
                    </div>

                    {/* Middle - Hero */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
                                <Leaf className="w-4 h-4 text-primary-200" />
                                <span className="text-white/90 text-sm font-medium">WHO ICOPE Framework</span>
                            </div>
                            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                                Empowering
                                <br />
                                <span className="text-primary-200">Healthy Ageing</span>
                            </h1>
                            <p className="text-white/70 text-lg max-w-md leading-relaxed">
                                A comprehensive platform for elderly health assessments, care planning, and community-based support.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm group hover:bg-white/15 transition-all duration-300"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                                        <feature.icon className="w-5 h-5 text-white/90" />
                                    </div>
                                    <span className="text-white/90 text-sm font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Trust badges */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {[
                                { icon: Shield, text: "HIPAA Compliant" },
                                { icon: Star, text: "Trusted Platform" },
                                { icon: Heart, text: "Elder-Friendly" },
                            ].map((badge, index) => (
                                <div key={index} className="flex items-center gap-2 text-white/60">
                                    <badge.icon className="w-4 h-4" />
                                    <span className="text-xs font-medium">{badge.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom - Stats */}
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">10K+</div>
                            <div className="text-white/60 text-xs">Elders Assessed</div>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">500+</div>
                            <div className="text-white/60 text-xs">Volunteers</div>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">95%</div>
                            <div className="text-white/60 text-xs">Early Detection</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Auth form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background relative">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 gradient-mesh opacity-50" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="w-full max-w-[440px] relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
