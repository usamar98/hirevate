"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  updateAccountPasswordAction,
  updateAccountProfileAction
} from "@/app/actions/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthStatusMessage, type AuthMessage } from "@/components/auth/auth-status-message";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  accountPasswordSchema,
  accountProfileSchema,
  type AccountPasswordValues,
  type AccountProfileValues
} from "@/lib/validators/auth";

export function ProfileSettingsForm({
  defaultValues
}: {
  defaultValues: AccountProfileValues;
}) {
  const [profileMessage, setProfileMessage] = useState<AuthMessage | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<AuthMessage | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const profileForm = useForm<AccountProfileValues>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues
  });
  const passwordForm = useForm<AccountPasswordValues>({
    resolver: zodResolver(accountPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  async function saveProfile(values: AccountProfileValues) {
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const result = await updateAccountProfileAction(values);
      setProfileMessage({
        text: result.ok ? result.message ?? "Your profile has been updated." : result.error,
        tone: result.ok ? "success" : "error"
      });
    } catch (error) {
      setProfileMessage({
        text: error instanceof Error ? error.message : "Unable to update your profile.",
        tone: "error"
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(values: AccountPasswordValues) {
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      const result = await updateAccountPasswordAction(values);
      setPasswordMessage({
        text: result.ok ? result.message ?? "Your password has been updated." : result.error,
        tone: result.ok ? "success" : "error"
      });
      if (result.ok) passwordForm.reset();
    } catch (error) {
      setPasswordMessage({
        text: error instanceof Error ? error.message : "Unable to update your password.",
        tone: "error"
      });
    } finally {
      setSavingPassword(false);
    }
  }

  const profileErrors = profileForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-brand-50 p-2 text-brand-700">
            <UserRound aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-ink-900">Personal details</h2>
            <p className="mt-1 text-sm text-ink-500">Keep your account details current.</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={profileForm.handleSubmit(saveProfile)}>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">Full name</span>
            <Input autoComplete="name" {...profileForm.register("fullName")} />
            {profileErrors.fullName ? (
              <span className="text-sm text-red-600">{profileErrors.fullName.message}</span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">Username</span>
            <Input autoCapitalize="none" autoComplete="username" {...profileForm.register("username")} />
            <span className="block text-xs text-ink-500">Use it instead of your email when logging in.</span>
            {profileErrors.username ? (
              <span className="text-sm text-red-600">{profileErrors.username.message}</span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">Email</span>
            <Input autoComplete="email" type="email" {...profileForm.register("email")} />
            <span className="block text-xs text-ink-500">Changing email may require inbox confirmation.</span>
            {profileErrors.email ? (
              <span className="text-sm text-red-600">{profileErrors.email.message}</span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">Location</span>
            <Input autoComplete="country-name" placeholder="Country or region" {...profileForm.register("countryName")} />
            {profileErrors.countryName ? (
              <span className="text-sm text-red-600">{profileErrors.countryName.message}</span>
            ) : null}
          </label>

          <AuthStatusMessage message={profileMessage} />
          <Button disabled={savingProfile} type="submit">
            {savingProfile ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            Save profile
          </Button>
        </form>
      </Card>

      <Card className="h-fit p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-gray-100 p-2 text-ink-700">
            <LockKeyhole aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-ink-900">Password</h2>
            <p className="mt-1 text-sm text-ink-500">Choose at least eight characters.</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={passwordForm.handleSubmit(savePassword)}>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">New password</span>
            <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" {...passwordForm.register("password")} />
            {passwordErrors.password ? (
              <span className="text-sm text-red-600">{passwordErrors.password.message}</span>
            ) : null}
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">Confirm new password</span>
            <PasswordInput autoComplete="new-password" placeholder="Enter the password again" {...passwordForm.register("confirmPassword")} />
            {passwordErrors.confirmPassword ? (
              <span className="text-sm text-red-600">{passwordErrors.confirmPassword.message}</span>
            ) : null}
          </label>
          <AuthStatusMessage message={passwordMessage} />
          <Button disabled={savingPassword} type="submit" variant="outline">
            {savingPassword ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
