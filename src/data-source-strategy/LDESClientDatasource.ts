import type { EventStream } from '@treecg/actor-init-ldes-client';
import { newEngine } from '@treecg/actor-init-ldes-client';
import type { Member, Bucketizer } from '@treecg/types';
import type { Config } from '../utils/Config';
import type Datasource from '../utils/interfaces/Datasource';
import type { LDESActionState } from '../utils/State';
import { loadState, saveState } from '../utils/State';

class LDESClientDatasource implements Datasource {
  public async getData(
    config: Config,
    bucketizer: Bucketizer,
  ): Promise<Member[]> {
    return new Promise<Member[]>((resolve, reject) => {
      try {
        const ldes = this.getLinkedDataEventStream(config.url, config.storage, config.dereference_members);

        const data: Member[] = [];

        // If run takes longer than x minutes, pause the LDES Client
        const timeout = setTimeout(() => ldes.pause(), config.timeout);

        ldes.on('data', (member: Member) => {
          bucketizer.bucketize(member.quads, member.id.value);
          data.push(member);
        });

        ldes.on('now only syncing', () => {
          timeout.unref();
          console.log('now only syncing');
          ldes.pause();
        });

        ldes.on('pause', () => {
          saveState(ldes.exportState(), bucketizer.exportState(), config.storage);

          console.log('No more data!');
          resolve(data);
        });
      } catch (error: unknown) {
        console.error(error);
        return reject(error);
      }
    });
  }

  public getLinkedDataEventStream(url: string, storage: string, dereferenceMembers: boolean): EventStream {
    const options = {
      emitMemberOnce: true,
      disableSynchronization: false,
      mimeType: 'text/turtle',
      representation: 'Quads',
      dereferenceMembers,
    };

    const LDESClient = newEngine();
    const state: LDESActionState | null = loadState(storage);
    if (state === null) {
      return LDESClient.createReadStream(url, options);
    }

    return LDESClient.createReadStream(url, options, state.LDESClientState);
  }
}

export default LDESClientDatasource;
