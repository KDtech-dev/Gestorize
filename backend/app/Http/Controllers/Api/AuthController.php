<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthLogoutRequest;
use App\Http\Requests\AuthRefreshRequest;
use App\Http\Requests\UpdateMeuPerfilRequest;
use App\Http\Resources\UserResource;
use App\Services\IAuthService;
use App\Services\ResponseService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private IAuthService $service) {}

    public function login(AuthLoginRequest $request): JsonResponse
    {
        return ResponseService::success(
            $this->service->login($request->validated())
        );
    }

    public function logout(AuthLogoutRequest $request): JsonResponse
    {
        $this->service->logout();

        return ResponseService::success([], 'Logout realizado com sucesso.');
    }

    public function refresh(AuthRefreshRequest $request): JsonResponse
    {
        return ResponseService::success(
            $this->service->refresh(),
            'Token atualizado.'
        );
    }

    public function me(Request $request): JsonResponse
    {
        $usuario = $request->user()->load([
            'roles.permissions',
            'permissions',
            'funcionario.endereco',
        ]);

        return ResponseService::success(new UserResource($usuario));
    }

    public function atualizarMeuPerfil(UpdateMeuPerfilRequest $request, UserService $users): JsonResponse
    {
        $usuario = $users->atualizarMeuPerfil($request->user(), $request->validated());

        return ResponseService::success(new UserResource($usuario), 'Perfil atualizado com sucesso.');
    }

    public function trocarSenhaPrimeiroAcesso(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $user = $request->user();

        if (! $user->must_change_password) {
            throw ValidationException::withMessages(['password' => 'A troca obrigatória da senha já foi concluída.']);
        }
        if (! Hash::check($dados['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'A senha inicial informada está incorreta.']);
        }
        if (Hash::check($dados['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => 'Escolha uma senha diferente da senha inicial.']);
        }

        $user->forceFill([
            'password' => Hash::make($dados['password']),
            'must_change_password' => false,
        ])->save();
        $user->load(['roles.permissions', 'permissions', 'funcionario.endereco']);

        return ResponseService::success(new UserResource($user), 'Senha atualizada com sucesso.');
    }
}
