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

export type DestinationBehaviorConstructor = (being: Being) => DestinationBehavior;
export type BehaviorsConstructors = Record<keyof Behaviors, DestinationBehaviorConstructor>;

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

function createBehaviors(being: Being, behaviorConstructors: BehaviorsConstructors): Behaviors {
  const behaviors: Partial<Behaviors> = {};
  for (const [behaviorKey, behaviorConstructor] of Object.entries(behaviorConstructors)) {
    behaviors[behaviorKey as keyof Behaviors] = behaviorConstructor(being);
  }
  return behaviors as Behaviors;
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

  behaviorConstructors: BehaviorsConstructors;
  behaviors: Behaviors;

  familyIds: Set<string> = new Set<string>();

  stats: BeingStats = {
    damageDealt: 0,
    damageTaken: 0,
  };

  position: Position;
  destination: Position | Being;

  bornAt: number = Date.now();

  constructor(genes: Genes, behaviorConstructors: BehaviorsConstructors, sex: Sex, group: string, startingPosition: Position) {
    this.genes = _.cloneDeep(genes);
    this.health = genes.maxHealth;
    this.sex = sex;
    this.group = group;
    this.position = _.cloneDeep(startingPosition);
    this.destination = _.cloneDeep(startingPosition);

    this.behaviorConstructors = behaviorConstructors
    this.behaviors = createBehaviors(this, behaviorConstructors);
  }

  static randomWithGenes(genes: Genes, behaviors: BehaviorsConstructors, group: string, position: Position): Being {
    const sex: Sex = randUtil.selectRandom(['male', 'female'])
    return new Being(genes, behaviors, sex, group, position);
  }

  /**
   * @deprecated
   * Very unsafe. Use with caution.
   */
  static fromRaw(raw: Pick<Being, 'genes' | 'behaviorConstructors' | 'sex' | 'group' | 'position'>): Being {
    const instance = new Being(raw.genes, raw.behaviorConstructors, raw.sex, raw.group, raw.position);
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
      target.health -= target.genes.attack;
    }
  }

  hurtBy(damage: number) {
    this.health = Math.max(0, this.health - damage);
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

  updateDestination(ctx: DestinationBehaviorContext): void {
    this.behaviors.destination.updateDestination(ctx);
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

    const behaviorConstructors: BehaviorsConstructors = {
      destination: randUtil.selectRandom([this.behaviorConstructors.destination, father.behaviorConstructors.destination]),
    }

    const child = Being.randomWithGenes(fuzzedGenes, behaviorConstructors, this.group, this.position);

    this.associateAsFamily(child);
    father.associateAsFamily(child);

    this.pregnancy = undefined;

    return child;
  }

  isDead(): boolean {
    return this.health <= 0;
  }
}

