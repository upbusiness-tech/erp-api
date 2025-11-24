import bcrypt from "bcryptjs";

export function criptografarSenha(senha: string) {
  return bcrypt.hashSync(senha, 10);
}

export function verificarSenha(senhaDigitada: string, senhaCriptografada: string) {
  return bcrypt.compareSync(senhaDigitada, senhaCriptografada);
}