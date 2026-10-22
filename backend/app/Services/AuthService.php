<?php

namespace App\Services;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService implements IAuthService
{
    /**
     * @param array{email:string,password:string} $credentials
     */
    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Credenciais inválidas.',
            ]);
        }

        $user->load(['roles.permissions', 'permissions']);

        $expiresAt = now()->addHours(3);
        $token = $user->createToken('api-token', [], $expiresAt)->plainTextToken;

        return [
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
            'user' => (new UserResource($user))->resolve(),
        ];
    }

    public function logout(): void
    {
        $user = request()->user();

        if (! $user) {
            throw new AuthenticationException('Não autenticado');
        }

        $user->currentAccessToken()?->delete();
    }

    public function refresh(): array
    {
        $user = auth()->user();

        if (! $user) {
            throw new AuthenticationException('Não autenticado');
        }

        $currentToken = $user->currentAccessToken();
        $expiresAt = $currentToken?->expires_at
            ?? $currentToken?->created_at?->copy()->addHours(3)
            ?? now();

        $currentToken?->delete();

        if ($expiresAt->isPast()) {
            throw new AuthenticationException('Sessão expirada. Faça login novamente.');
        }

        $newToken = $user->createToken('api-token', [], $expiresAt)->plainTextToken;

        return [
            'token' => $newToken,
            'expires_at' => $expiresAt->toIso8601String(),
            'user' => (new UserResource($user))->resolve(),
        ];
    }
}
