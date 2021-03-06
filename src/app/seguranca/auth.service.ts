import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';

import { JwtHelper } from 'angular2-jwt';

import { environment } from './../../environments/environment';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class AuthService {

  oauthTokenUrl: string;
  jwtPayload: any;

  constructor(
    private http: Http,
    private jwtHelper: JwtHelper
  ) {
    this.oauthTokenUrl = `${environment.apiUrl}/oauth/token`;
    this.carregarToken();
  }

  login(usuario: string, senha: string): Promise<void> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    headers.append('Authorization', 'Basic YW5ndWxhcjphbmd1bGFy');

    const body = `username=${usuario}&password=${senha}&grant_type=password`;

    return this.http.post(this.oauthTokenUrl, body,
        { headers, withCredentials: true } )
      .toPromise()
      .then(response => {
        this.armazenarToken(response.json().access_token);
      })
      .catch(error => {
        if (error.status === 400) {
          const responseJson = error.json();
          if (responseJson.error === 'invalid_grant') {
            return Promise.reject('Usuário ou senha inválida.');
          }

          return Promise.reject(error);
        }
      });
  }

  obterNovoAccessToken(): Promise<void> {
    const body = 'grant_type=refresh_token';
    const headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    headers.append('Authorization', 'Basic YW5ndWxhcjphbmd1bGFy');
    return this.http.post(this.oauthTokenUrl, body,
        { headers, withCredentials: true } )
      .toPromise()
      .then((response) => {
        this.armazenarToken(response.json().access_token);
        return Promise.resolve(null);
      })
      .catch((erro) => {
        console.error('Erro ao renovar token', erro);
        return Promise.resolve(null);
      });
  }

  limparAccessToken() {
    localStorage.removeItem('token');
    this.jwtPayload = null;
  }

  /**
   * Retorna token inválido ou não
   */
  isAccessTokenInvalido() {
    const token = localStorage.getItem('token');
    return !token || this.jwtHelper.isTokenExpired(token);
  }

  temPermissao(permissao: string) {
    return this.jwtPayload && this.jwtPayload.authorities.includes(permissao);
  }

  /**
   *
   * @param roles
   * Retorna true se contém pelo menos uma das permissões do array
   *
   */
  temUmaDasPermissoes(roles: string[]) {
    for (const role of roles) {
      if (this.temPermissao(role)) {
        return true;
      }
    }

  return false;
  }

  /**
   * Decodifica e armazena no localStorage do browser
   * @param token
   */
  private armazenarToken(token: string) {
    this.jwtPayload = this.jwtHelper.decodeToken(token);
    localStorage.setItem('token', token);
  }

  /**
   * Verifica se existe token e armazena
   */
  private carregarToken() {
    const token = localStorage.getItem('token');
    if (token) {
      this.armazenarToken(token);
    }
  }

}
