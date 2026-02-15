import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import * as mathUtil from '../util/math'
import * as randUtil from '../util/random'

import config from '../config';

import { Position } from './Misc';
import { DestinationBehavior, DestinationBehaviorContext } from '../core/behaviors/destination';

export interface Genes {
  maxHealth: number;

  attack: number;
  defense: number;

  speed: number;
  size: number;
}

export interface Behaviors {
  destination: DestinationBehavior;
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

  behaviors: Behaviors;

  familyIds: Set<string> = new Set<string>();

  stats: BeingStats = {
    damageDealt: 0,
    damageTaken: 0,
  };

  position: Position;
  destination: Position | Being;

  bornAt: number = Date.now();

  constructor(genes: Genes, behaviors: Behaviors, sex: Sex, group: string, startingPosition: Position) {
    this.genes = _.cloneDeep(genes);
    this.behaviors = _.cloneDeep(behaviors);

    this.health = genes.maxHealth;
    this.sex = sex;
    this.group = group;
    this.position = _.cloneDeep(startingPosition);
    this.destination = _.cloneDeep(startingPosition);


  }

  static randomWithGenes(genes: Genes, behaviors: Behaviors, group: string, position: Position): Being {
    const sex: Sex = randUtil.selectRandom(['male', 'female'])
    return new Being(genes, behaviors, sex, group, position);
  }

  /**
   * @deprecated
   * Very unsafe. Use with caution.
   */
  static fromRaw(raw: Pick<Being, 'genes' | 'behaviors' | 'sex' | 'group' | 'position'>): Being {
    const instance = new Being(raw.genes, raw.behaviors, raw.sex, raw.group, raw.position);
    Object.assign(instance, raw);

    return instance;
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

  attack(target: Being) {
    if (this.genes.attack > target.genes.defense) {
      const damage = this.genes.attack - target.genes.defense;
      target.hurtBy(damage);
      this.healBy(damage / 2);
      this.stats.damageDealt += damage;
    }
  }

  hurtBy(damage: number) {
    this.health = Math.max(0, this.health - damage);
    this.stats.damageTaken += damage;
  }

  healBy(health: number) {
    this.health = Math.min(this.genes.maxHealth, this.health + health);
  }

  age(): number {
    return Date.now() - this.bornAt;
  }

  becomesPregnantFrom(father: Being, pregnancyDuration: number) {
    if (!this.pregnancy) {
      this.pregnancy = {
        father: father,
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

  updateDestination(ctx: DestinationBehaviorContext): void {
    this.behaviors.destination.updateDestination(this, ctx);
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

    const behaviors: Behaviors = {
      destination: randUtil.selectRandom([this.behaviors.destination, father.behaviors.destination]),
    }

    const child = Being.randomWithGenes(fuzzedGenes, behaviors, this.group, this.position);

    this.associateAsFamily(child);
    father.associateAsFamily(child);

    this.pregnancy = undefined;

    return child;
  }

  isDead(): boolean {
    return this.health <= 0;
  }
}

