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
        $isGlobalAdmin = $user?->hasRole('admin') && ! $user->organization_id;
        $globalPaths = ['api/logout', 'api/refresh', 'api/me', 'api/ajuda/contato'];

        if ($path === 'api/logout') {
            return $next($request);
        }

        if ($isGlobalAdmin && ! in_array($path, $globalPaths, true)) {
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
