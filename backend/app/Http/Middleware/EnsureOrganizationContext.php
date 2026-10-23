<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrganizationContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $path = $request->path();
        $passwordChangePath = $path === 'api/primeiro-acesso/alterar-senha';
        $passwordBootstrapPath = $path === 'api/logout'
            || $path === 'api/refresh'
            || ($path === 'api/me' && $request->isMethod('GET'))
            || $passwordChangePath;
        $globalPathAllowed = $path === 'api/logout'
            || $path === 'api/refresh'
            || $path === 'api/me'
            || $path === 'api/ajuda/contato';
        $isGlobalAdmin = $user?->hasRole('admin') && ! $user->organization_id;

        if ($path === 'api/logout') {
            return $next($request);
        }

        if ($user?->must_change_password && ! $passwordBootstrapPath) {
            return response()->json(['success' => false, 'message' => 'Troque sua senha inicial para continuar.'], 403);
        }

        if ($isGlobalAdmin && ! $globalPathAllowed) {
            return response()->json(['success' => false, 'message' => 'Acesso disponível somente dentro de uma organização.'], 403);
        }

        if (! $isGlobalAdmin && ! $user?->organization_id) {
            return response()->json(['success' => false, 'message' => 'Sua conta ainda não está vinculada a uma organização.'], 403);
        }

        if ($user?->organization_id && ! $user->organization?->active) {
            return response()->json(['success' => false, 'message' => 'Esta organização está inativa.'], 403);
        }

        return $next($request);
    }
}
