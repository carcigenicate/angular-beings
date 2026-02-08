import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import * as mathUtil from '../util/math'
import * as randUtil from '../util/random'

import config from '../config';

import { Position } from './Misc';

export type Genes = {
  maxHealth: number;

  attack: number;
  defense: number;

  speed: number;
  size: number;
}

export type Sex = 'male' | 'female';

interface BeingStats {
  damageDealt: number;
  damageTaken: number;
}

export function fuzzGenes(genes: Genes, fuzzBy: number) {
  const genesCopy = _.cloneDeep(genes);

  for (const [geneKey, geneValue] of Object.entries(genesCopy)) {
    const rawNewGene = randUtil.randomFloat(geneValue - fuzzBy, geneValue + fuzzBy);
    genesCopy[geneKey as keyof Genes] = _.clamp(rawNewGene, 0, 1000);
  }

  return genesCopy;
}

export class Being {
  id: string = uuid();

  health: number;

  sex: Sex;
  genes: Genes;
  group: string;
  pregnancy?: {
    father: Being;
    dueAt: number;
  };

  familyIds: Set<string> = new Set<string>();

  stats: BeingStats = {
    damageDealt: 0,
    damageTaken: 0,
  };

  position: Position;
  destination: Position | Being;

  forceRandomPositionAt?: number = Date.now().valueOf();

  bornAt: number = Date.now().valueOf();

  constructor(genes: Genes, sex: Sex, group: string, startingPosition: Position) {
    this.genes = _.cloneDeep(genes);
    this.health = genes.maxHealth;
    this.sex = sex;
    this.group = group;
    this.position = _.cloneDeep(startingPosition);
    this.destination = _.cloneDeep(startingPosition);

  }

  static randomChildWithGenes(genes: Genes, group: string, position: Position): Being {
    const sex: Sex = randUtil.selectRandom(['male', 'female'])
    return new Being(genes, sex, group, position);
  }

  getDestinationPosition(): Position {
    if (this.destination instanceof Being) {
      return this.destination.position;
    } else {
      return this.destination;
    }
  }

  moveTowardsDestinationBy(distance: number) {
    const destPosition = this.getDestinationPosition();
    const { x: destX, y: destY } = destPosition;
    const { x, y } = this.position;

    const xTo = destX - x;
    const yTo = destY - y;

    const angle = Math.atan2(yTo, xTo);

    const distanceToDestination = mathUtil.distanceTo(this.position, destPosition);
    const moveByDistance = Math.min(distance, distanceToDestination);

    const xDelta = Math.cos(angle) * moveByDistance;
    const yDelta = Math.sin(angle) * moveByDistance;

    this.position.x += xDelta;
    this.position.y += yDelta;
  }

  assignNewTemporaryTargetBeing(newTarget: Being, targetFor: number = 2000) {
    this.destination = newTarget;

    if (!this.forceRandomPositionAt) {
      this.forceRandomPositionAt = Date.now() + targetFor;
    }
  }

  attack(target: Being) {
    if (this.genes.attack > target.genes.defense) {
      target.health -= target.genes.attack;
    }
  }

  impregnate(mother: Being, pregnancyDuration: number) {
    if (!mother.pregnancy) {
      mother.pregnancy = {
        father: this,
        dueAt: Date.now() + pregnancyDuration,
      };
    }
  }

  calculateFitness(): number {
    return this.stats.damageDealt - this.stats.damageTaken;
  }

  isFamily(beingId: string): boolean {
    return this.familyIds.has(beingId);
  }

  associateAsFamily(being: Being) {
    this.familyIds.add(being.id);
    being.familyIds.add(this.id);
  }

  pregnancyIsDue() {
    if (this.pregnancy) {
      return this.pregnancy.dueAt < Date.now();
    } else {
      return false;
    }
  }

  produceChild(): Being {
    if (!this.pregnancy) {
      throw new Error('Cannot produce a child');
    }

    const father = this.pregnancy.father;

    const baseGenes = this.calculateFitness() > father.calculateFitness() ? this.genes : father.genes;
    const fuzzedGenes = fuzzGenes(baseGenes, config.GENE_FUZZ_AMOUNT);

    const child = Being.randomChildWithGenes(fuzzedGenes, this.group, this.position);

    this.associateAsFamily(child);
    father.associateAsFamily(child);

    this.pregnancy = undefined;

    return child;
  }

  isDead(): boolean {
    return this.health <= 0;
  }
}

