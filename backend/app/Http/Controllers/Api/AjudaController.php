<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AjudaController extends Controller
{
    public function contato(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'mensagem' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $usuario = $request->user();
        $nome = $usuario->nome ?? $usuario->name ?? 'Usuário Gestorize';
        $email = $usuario->email;

        Mail::raw(
            "Report de ajuda Gestorize\n\nNome: {$nome}\nE-mail: {$email}\n\nMensagem:\n{$dados['mensagem']}",
            function ($mail) use ($nome, $email) {
                $mail->to('kennedy@kdtech.dev')
                    ->replyTo($email, $nome)
                    ->subject('Report de ajuda Gestorize');
            },
        );

        return ResponseService::success([], 'Sua mensagem foi enviada ao suporte.');
    }
}
