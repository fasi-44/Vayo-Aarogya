"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, ArrowLeft, CheckCircle2, HeartPulse } from "lucide-react";

const forgotPasswordSchema = z.object({
    phone: z.string().length(10, "Phone number must be exactly 10 digits").regex(/^\d{10}$/, "Phone number must be 10 digits"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [submittedPhone, setSubmittedPhone] = React.useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Forgot password data:", data);
        setIsLoading(false);
        setSubmittedPhone(data.phone);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <Card className="border-0 shadow-xl animate-fade-in">
                <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-healthy/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-healthy" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        Reset link sent
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        We&apos;ve sent a password reset link to
                        <br />
                        <span className="font-medium text-foreground">{submittedPhone}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Didn&apos;t receive the message? Please check and try again.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setIsSubmitted(false)}
                        className="mb-4"
                    >
                        Try another number
                    </Button>
                    <div className="mt-4">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-xl animate-fade-in">
            <CardHeader className="text-center pb-2">
                {/* Mobile logo */}
                <div className="lg:hidden flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-xl gradient-medical flex items-center justify-center">
                        <HeartPulse className="w-8 h-8 text-white" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                    Forgot password?
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    No worries, we&apos;ll send you reset instructions
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Phone Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            icon={<Phone className="w-4 h-4" />}
                            error={errors.phone?.message}
                            maxLength={10}
                            {...register("phone")}
                        />
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full gradient-medical text-white hover:opacity-90" size="lg" loading={isLoading}>
                        Send Reset Link
                    </Button>

                    {/* Back to login */}
                    <div className="text-center mt-4">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to sign in
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
