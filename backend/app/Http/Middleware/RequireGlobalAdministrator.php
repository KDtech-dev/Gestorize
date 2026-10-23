<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireGlobalAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user?->hasRole('admin') && ! $user->organization_id, 403, 'Acesso restrito ao administrador global.');

        return $next($request);
    }
}
