<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthLogoutRequest;
use App\Http\Requests\AuthRefreshRequest;
use App\Http\Resources\UserResource;
use App\Services\IAuthService;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
