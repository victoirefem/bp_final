/*
 * SpdzWiseShuffler.h
 *
 */

#ifndef PROTOCOLS_SPDZWISEREP3SHUFFLER_H_
#define PROTOCOLS_SPDZWISEREP3SHUFFLER_H_

#include "Rep3Shuffler.h"
#include "ProtocolSet.h"

template<class T>
class SpdzWiseRep3Shuffler
{
    SubProcessor<T>& proc;

    ProtocolSet<typename T::part_type::Honest> internal_set;
    Rep3Shuffler<typename T::part_type::Honest> internal;

public:
    typedef typename Rep3Shuffler<T>::store_type store_type;
    typedef typename Rep3Shuffler<T>::shuffle_type shuffle_type;

    map<long, long> stats;

    SpdzWiseRep3Shuffler(StackedVector<T>& a, size_t n, int unit_size, size_t output_base,
            size_t input_base, SubProcessor<T>& proc);

    SpdzWiseRep3Shuffler(SubProcessor<T>& proc);

    int generate(int n_shuffle, store_type& store);

    void apply(StackedVector<T>& a, size_t n, int unit_size, size_t output_base,
            size_t input_base, shuffle_type& shuffle, bool reverse);

    void inverse_permutation(StackedVector<T>& stack, size_t n, size_t output_base,
            size_t input_base);
};

#endif /* PROTOCOLS_SPDZWISEREP3SHUFFLER_H_ */
