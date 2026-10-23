<?php

use App\Http\Middleware\PreventAdminSelfDeletion;
use App\Http\Middleware\EnsureOrganizationContext;
use App\Http\Middleware\RequireGlobalAdministrator;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Providers\ServiceServiceProvider;
use Illuminate\Http\Middleware\HandleCors;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->use([
            HandleCors::class,
        ]);
        $middleware->alias([
            'role'               => RoleMiddleware::class,
            'permission'         => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'prevent.admin.self.deletion' => PreventAdminSelfDeletion::class,
            'tenant.context' => EnsureOrganizationContext::class,
            'global.admin' => RequireGlobalAdministrator::class,
        ]);


        $middleware->redirectGuestsTo(fn() => null);
    })
    ->withProviders([
        ServiceServiceProvider::class,
    ])
    ->withExceptions(function (Exceptions $exceptions): void {})
    ->withSingletons([Illuminate\Contracts\Debug\ExceptionHandler::class => App\Exceptions\Handler::class])
    ->create();
