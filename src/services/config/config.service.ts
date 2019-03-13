import { Injectable } from '@angular/core';

import { DbService } from '../db/db.service';
import { ConfigServiceInterface } from './config.service.interface';

@Injectable({
  providedIn: 'root'
})
export class ConfigService implements ConfigServiceInterface {
  private config: any;
  public defaultBucket: string;
  private db: DbService;

  public updateBucketConfig(buckets: Array<object>) {
    return this.db.update('buckets', buckets).then(() => {});
  }

  public getBucketCredentials(bucketName: string): object {
    if (this.getBucket(bucketName)) {
      return this.getBucket(bucketName).getCredentials();
    }
  }

  public getBucket(bucketName: string): Bucket {
    const currentBucket = this.getBuckets().then((buckets: Array<Bucket>) => {
      buckets.filter((bucket: Bucket) => {
        return bucket.bucketName === bucketName;
      });
    });

    return currentBucket[0];
  }

  public getBuckets(): Promise<Array<Bucket>> {
    return new Promise((resolve, reject) => {
      return this.db.get('buckets').then((buckets: Array<object>) => {
        return resolve(
          buckets
            ? buckets.map((config: BucketConfig) => {
                return new Bucket(config);
              })
            : []
        );
      });
    });
  }

  public get appName(): string {
    return 's3 See';
  }

  constructor() {
    this.db = new DbService('config', 'key');

    this.getBuckets().then((buckets) => {
      if (buckets.length) {
        this.defaultBucket = buckets[0].bucketName;
      }
    });
  }
}

export class Bucket {
  getCredentials(): object {
    return {
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      region: this.config.region
    };
  }

  get bucketName(): string {
    return this.config.bucketName;
  }

  get label(): string {
    return this.config.label;
  }

  constructor(private config: BucketConfig) {}
}

export type BucketConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  label: string;
};
