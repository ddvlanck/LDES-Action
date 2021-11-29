import type { EventStream } from '@treecg/actor-init-ldes-client';
import type { Member, Bucketizer } from '@treecg/types';
import type { Config } from '../Config';

interface Datasource {
  getData: (config: Config, bucketizer: Bucketizer) => Promise<Member[]>;
  getLinkedDataEventStream: (url: string, storage: string, dereferenceMembers: boolean) => EventStream;
}

export default Datasource;
