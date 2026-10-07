import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/login"
          signUpFallbackRedirectUrl="/login"
        />
        <p className="text-sm font-medium text-gray-500 mt-4 animate-pulse">
          Menghubungkan sesi autentikasi...
        </p>
      </div>
    </div>
  );
}
