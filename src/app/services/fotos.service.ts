import { Foto } from './../models/Foto.interface';
import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { readBlobAsBase64 } from '@capacitor/core/types/core-plugins';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class FotosService {
  //lista das fotos amazenadas no dispositivo
  fotos: Foto[] = [];
  //cria uma variavel para armazenar o local fisico das fotos
  private FOTO_ARMAZENAMENTO: string = 'fotos';

  constructor(private platform: Platform) {}

  public async carregarFotosSalvas() {
    // Recuperar as fotos em cache
    const listaFotos = await Preferences.get({ key: this.FOTO_ARMAZENAMENTO });
    this.fotos = JSON.parse(listaFotos.value as string) || [];

    // Se Não estiver rodando no navegador...
    if (!this.platform.is('hybrid')) {
      // Exibir a foto lendo-a no formato base64
      for (let foto of this.fotos) {
        // Ler os dados de cada foto salva no sistema de arquivos
        const readFile = await Filesystem.readFile({
          path: foto.filepath,
          directory: Directory.Data,
        });

        // Somente na plataforma da web: carregar a foto como dados base64
        foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }
  public async tirarFotos() {
    //tirar foto
    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri, //dados baseados em arquivado; oferece o melhor desempenho
      source: CameraSource.Camera, //Tirar automaticament uma nova foto com a camera
      quality: 50, //Deixar em 50 para nao gerar um arquivo muito grande em cameras boas pakas
    });
    const salvaArquivoFoto = await this.salvarFoto(fotoCapturada);
    //adicionar Foto
    this.fotos.unshift(salvaArquivoFoto);

    // armazenar em cache todos os dados da foto para recuperação futura
    Preferences.set({
      key: this.FOTO_ARMAZENAMENTO,
      value: JSON.stringify(this.fotos),
    });
  }
  //Salvar Imagem em um arquivo do dispositivo
  private async salvarFoto(foto: Photo) {
    // converta a foto para o formato base64, exigido pela API do sisterma de arquivo para salvar
    const base64Data = await this.readAsBase64(foto);

    //gravar o arquivo no diretorio de dados
    const nomeArquivo = new Date().getTime() + '.jpeg';
    const arquivoSalvo = await Filesystem.writeFile({
      path: nomeArquivo,
      data: base64Data,
      directory: Directory.Data,
    });
    if (this.platform.is('hybrid')) {
      //exiba a nova imagem reescrevendo o caminho 'file://para HTTP
      //Detalhes : https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: arquivoSalvo.uri,
        webviewpath: Capacitor.convertFileSrc(arquivoSalvo.uri),
      };
    } else {
      //use webPathb para exibir a nova imagm em vez da bas 64 , pois ela ja esta carregada na memoria
      return {
        filepath: nomeArquivo,
        webviewpath: foto.webPath,
      };
    }
  }
  private async readAsBase64(foto: Photo) {
    //hibrido detectara cordova ou capacitor
    if (this.platform.is('hybrid')) {
      //ler arquivo foto
      const arquivo = await Filesystem.readFile({
        path: foto.path as string,
      });
      return arquivo.data;
    } else {
      //obtenha a foto , leai como um blb e em seguida converta a para formato base64
      const resposta = await fetch(foto.webPath!);
      const blob = await resposta.blob();

      return (await this.convertBlobToBase64(blob)) as string;
    }
  } //excuir imagem, removendo a dos dados de referencia e do sistema de arquivos
  public async deletePicture(foto: Foto, posicao: number) {
    this.fotos.splice(posicao, 1);
    // atualizar foto da matriz de dados sobescrevendo as matriz de dados da foto existente
    Preferences.set({
      key: this.FOTO_ARMAZENAMENTO,
      value: JSON.stringify(this.fotos),
    });

    //excluir o arquivo de foto do sistema de arquivo
    const nomeArquivo = foto.filepath.substr(
      foto.filepath.lastIndexOf('/') + 1
    );
    await Filesystem.deleteFile({
      path: nomeArquivo,
      directory: Directory.Data,
    });
  }
  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  async getBlob(foto: Foto) {
    // Busca o arquivo no File System
    const file = await this.readFile(foto);
    // Converte o arquivo para Blob
    const response = await fetch(file);
    // Retorna o Blob
    return await response.blob();
  }

  private async readFile(foto: Foto) {
    // If running on the web...
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base64 format
      const readFile = await Filesystem.readFile({
        path: foto.filepath,
        directory: Directory.Data,
      });

      // Web platform only: Load the photo as base64 data
      foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }

    return foto.webviewPath as string;
  }
  
}
