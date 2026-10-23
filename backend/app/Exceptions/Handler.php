<?php

namespace App\Exceptions;

use App\Services\ResponseService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->renderable(function (DomainException $e, Request $request) {
            if (!$request->is('api/*')) {
                return;
            }

            if ($e->isError()) {
                return ResponseService::exception($e, $e->getCode(), $e->getMessage());
            }

            return ResponseService::success([], $e->getMessage(), $e->getCode());
        });

        $this->renderable(function (Throwable $e, Request $request) {
            if (!$request->is('api/*')) {
                return;
            }

            return ResponseService::exception(
                $e,
                Response::HTTP_INTERNAL_SERVER_ERROR,
                $e->getMessage() ?? 'Ocorreu um erro inesperado no sistema.'
            );
        });
    }

    public function render($request, Throwable $e): Response|JsonResponse
    {
        if ($e instanceof ValidationException) {
            $status = $e->status;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => $status,
                'errors' => $e->errors(),
            ], $status);
        }

        if ($e instanceof AuthenticationException) {
            return ResponseService::exception(
                $e,
                Response::HTTP_UNAUTHORIZED,
                'Não autenticado.'
            );
        }

        if ($e instanceof UnauthorizedException) {
            return ResponseService::exception(
                $e,
                Response::HTTP_FORBIDDEN,
                'Você não possui permissão para esta ação.'
            );
        }

        if ($e instanceof AuthorizationException || $e->getPrevious() instanceof AuthorizationException) {
            return ResponseService::exception(
                $e,
                Response::HTTP_FORBIDDEN,
                'Ação não autorizada.'
            );
        }

        if ($e instanceof ModelNotFoundException) {
            $modelClass = $e->getModel();
            $modelName = $modelClass ? class_basename($modelClass) : 'Recurso';
            $ids = $e->getIds();
            $identificador = $ids[0] ?? 'informado';

            return response()->json(
                [
                    'success' => false,
                    'message' => "O recurso {$modelName} com ID {$identificador} não foi encontrado.",
                    'code' => Response::HTTP_NOT_FOUND,
                ],
                Response::HTTP_NOT_FOUND
            );
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            $message = trim($e->getMessage()) ?: (Response::$statusTexts[$status] ?? 'Erro na requisição.');

            return ResponseService::error($message, $status);
        }

        return parent::render($request, $e);
    }

    protected function unauthenticated($request, AuthenticationException $exception)
    {
        return ResponseService::exception(
            $exception,
            Response::HTTP_UNAUTHORIZED,
            'Não autenticado.'
        );
    }
}
