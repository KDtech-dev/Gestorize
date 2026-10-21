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

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'token' => $token,
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

        $user->currentAccessToken()?->delete();

        $newToken = $user->createToken('api-token')->plainTextToken;

        return [
            'token' => $newToken,
            'user' => (new UserResource($user))->resolve(),
        ];
    }
}
