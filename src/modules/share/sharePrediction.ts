import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { captureError } from '../../core/observability/sentry';

/**
 * Compartilhamento do palpite como imagem (RF54).
 *
 * captureRef transforma a view em PNG; o Share do Android abre o seletor de
 * aplicativos. A imagem vai para o diretório de cache, não para o de
 * documentos: é descartável e não deve ocupar espaço permanente.
 */
export type ShareResult = { shared: boolean; uri?: string; reason?: string };

export async function sharePredictionCard(
  viewRef: React.RefObject<unknown>,
  { fileName = 'palpite', title = 'Meu palpite no StatsPalpite' } = {},
): Promise<ShareResult> {
  if (!viewRef.current) {
    return { shared: false, reason: 'Nada para capturar' };
  }

  try {
    const captured = await captureRef(viewRef as never, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    // Renomeia para um nome legível: é ele que o seletor mostra ao usuário.
    const source = new File(captured);
    const target = new File(Paths.cache, `${fileName}-${Date.now()}.png`);
    source.move(target);

    const result = await Share.share({ url: target.uri, title, message: title });

    return { shared: result.action === Share.sharedAction, uri: target.uri };
  } catch (error) {
    captureError(error, { feature: 'sharePrediction' });
    return { shared: false, reason: 'Não foi possível compartilhar' };
  }
}
